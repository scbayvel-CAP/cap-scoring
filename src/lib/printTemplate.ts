interface PrintTemplateOptions {
  athleteName: string
  bibNumber: string
  qrCodeHtml: string
}

export function generateQRPrintTemplate({
  athleteName,
  bibNumber,
  qrCodeHtml,
}: PrintTemplateOptions): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>QR Code - ${athleteName}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .qr-container {
      text-align: center;
      padding: 40px;
      border: 2px solid #000;
      border-radius: 16px;
    }
    .athlete-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .bib-number {
      font-size: 18px;
      color: #666;
      margin-bottom: 24px;
    }
    .qr-code {
      margin-bottom: 24px;
    }
    .instructions {
      font-size: 14px;
      color: #666;
      max-width: 200px;
    }
    @media print {
      body { padding: 0; }
      .qr-container { border: none; }
    }
  </style>
</head>
<body>
  <div class="qr-container">
    <div class="athlete-name">${athleteName}</div>
    <div class="bib-number">Bib #${bibNumber}</div>
    <div class="qr-code">
      ${qrCodeHtml}
    </div>
    <div class="instructions">
      Scan to view live results
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); window.close(); }
  </script>
</body>
</html>`
}
