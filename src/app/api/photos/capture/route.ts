import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Read file buffer (client-side compression is sufficient)
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate storage path
    const timestamp = Date.now()
    const storagePath = `${eventId}/station${station}_heat${heatNumber}/${bibNumber}_${timestamp}.jpg`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('score-photos')
      .upload(storagePath, buffer, {
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

    // Insert score_photos row
    const { data: photoRow, error: insertError } = await supabase
      .from('score_photos')
      .insert({
        athlete_id: athleteId,
        event_id: eventId,
        station,
        storage_path: storagePath,
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
      thumbnailUrl: signedUrlData?.signedUrl || null,
    })
  } catch (err) {
    console.error('Photo capture error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
