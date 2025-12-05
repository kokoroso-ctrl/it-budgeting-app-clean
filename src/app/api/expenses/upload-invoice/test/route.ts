import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create a minimal valid PDF file in base64
    // This is a simple PDF with just a single page saying "Test Invoice"
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Invoice) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;

    // Convert PDF content to base64
    const base64Pdf = Buffer.from(pdfContent).toString('base64');
    const base64DataUri = `data:application/pdf;base64,${base64Pdf}`;

    // Create FormData for the upload request
    const formData = new FormData();
    formData.append('expenseId', '310');
    
    // Create a Blob from the base64 data
    const blob = await (await fetch(base64DataUri)).blob();
    formData.append('invoice', blob, 'test-invoice.pdf');

    // Get the base URL from the request
    const baseUrl = request.nextUrl.origin;
    
    // Make the request to the upload endpoint
    const uploadResponse = await fetch(`${baseUrl}/api/expenses/upload-invoice`, {
      method: 'POST',
      body: formData,
      headers: {
        // Forward any authentication cookies from the original request
        'cookie': request.headers.get('cookie') || '',
      },
    });

    const responseData = await uploadResponse.json();

    // Return the response from the upload endpoint with additional test metadata
    return NextResponse.json({
      testInfo: {
        message: 'Test invoice upload completed',
        expenseId: 310,
        filename: 'test-invoice.pdf',
        mimeType: 'application/pdf',
        base64Length: base64Pdf.length,
        pdfSize: Buffer.from(pdfContent).length,
      },
      uploadResponse: responseData,
      statusCode: uploadResponse.status,
    }, { status: 200 });

  } catch (error) {
    console.error('Test invoice upload error:', error);
    return NextResponse.json({
      error: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'TEST_FAILED'
    }, { status: 500 });
  }
}