import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import sharp from 'sharp'

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

const VISION_PROMPT = `You are reading a fitness machine display (rowing machine, bike, ski erg, or treadmill) showing a distance result.

Look at the image and extract the total distance shown on the display.

Return ONLY a JSON object with these fields:
- "distance": the distance as an integer in meters. If the display shows km, convert to meters (e.g., 4.523 km = 4523 m). If displayed in meters already, use that value directly.
- "confidence": a number from 0 to 1 indicating how confident you are in the reading. Use 1.0 if clearly readable, 0.8+ if mostly clear, below 0.7 if partially obscured or unclear.
- "unit": the unit shown on the display ("m" or "km")
- "raw_display": the exact text/number shown on the display before any conversion

Example responses:
{"distance": 4523, "confidence": 0.95, "unit": "m", "raw_display": "4523"}
{"distance": 6200, "confidence": 0.88, "unit": "km", "raw_display": "6.200"}

If you cannot read any distance from the image, return:
{"distance": null, "confidence": 0, "unit": null, "raw_display": null, "error": "Could not read distance from display"}

Return ONLY the JSON object, no other text.`

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const athleteId = formData.get('athleteId') as string
    const eventId = formData.get('eventId') as string
    const station = parseInt(formData.get('station') as string, 10)
    const bibNumber = formData.get('bibNumber') as string
    const heatNumber = formData.get('heatNumber') as string

    if (!imageFile || !athleteId || !eventId || !station) {
      return NextResponse.json(
        { error: 'Missing required fields: image, athleteId, eventId, station' },
        { status: 400 }
      )
    }

    // Read file buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Compress image with sharp (max 1024px, JPEG quality 80)
    const compressed = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Generate storage path
    const timestamp = Date.now()
    const storagePath = `${eventId}/station${station}_heat${heatNumber}/${bibNumber}_${timestamp}.jpg`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('score-photos')
      .upload(storagePath, compressed, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      )
    }

    // Send to OpenAI Vision
    const base64Image = compressed.toString('base64')
    let aiResult: {
      distance: number | null
      confidence: number
      unit: string | null
      raw_display: string | null
      error?: string
    }

    try {
      const openai = getOpenAIClient()
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISION_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0,
      })

      const content = response.choices[0]?.message?.content?.trim() || ''

      // Parse JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0])
      } else {
        aiResult = { distance: null, confidence: 0, unit: null, raw_display: null, error: 'Invalid AI response' }
      }
    } catch (aiError) {
      console.error('OpenAI Vision error:', aiError)
      aiResult = { distance: null, confidence: 0, unit: null, raw_display: null, error: 'AI analysis failed' }
    }

    // Insert score_photos row
    const { data: photoRow, error: insertError } = await supabase
      .from('score_photos')
      .insert({
        athlete_id: athleteId,
        event_id: eventId,
        station,
        storage_path: storagePath,
        ai_extracted_value: aiResult.distance,
        ai_confidence: aiResult.confidence,
        ai_raw_response: aiResult as Record<string, unknown>,
        uploaded_by: user.id,
        metadata: {
          bib_number: bibNumber,
          heat_number: heatNumber,
          original_filename: imageFile.name,
        },
      } as never)
      .select()
      .single()

    if (insertError) {
      console.error('Insert score_photos error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    // Generate a signed URL for the thumbnail
    const { data: signedUrlData } = await supabase.storage
      .from('score-photos')
      .createSignedUrl(storagePath, 3600) // 1 hour

    return NextResponse.json({
      photoId: (photoRow as { id: string }).id,
      distance: aiResult.distance,
      confidence: aiResult.confidence,
      thumbnailUrl: signedUrlData?.signedUrl || null,
      aiError: aiResult.error || null,
    })
  } catch (err) {
    console.error('Photo capture error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
