import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Helper to parse multipart form data manually without external middleware
async function parseMultipart(
  request: Request,
): Promise<{ file: Buffer; mimeType: string; fileName: string } | null> {
  const contentType = request.headers.get('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    return null;
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);

  if (!boundaryMatch) {
    return null;
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const bodyBuffer = Buffer.from(await request.arrayBuffer());
  const boundaryBuffer = Buffer.from(`--${boundary}`);

  // Find the file part
  const parts = bufferSplit(bodyBuffer, boundaryBuffer);
  for (const part of parts) {
    const partStr = part.toString('utf-8', 0, Math.min(part.length, 1000));

    if (!partStr.includes('Content-Disposition')) continue;
    if (
      !partStr.includes('name="file"') &&
      !partStr.includes("name='file'") &&
      !partStr.includes('name=file')
    )
      continue;

    // Find where headers end and body begins (double CRLF)
    const headerEndIndex = findDoubleCRLF(part);
    if (headerEndIndex === -1) continue;

    const headers = part
      .subarray(0, headerEndIndex)
      .toString('utf-8')
      .toLowerCase();

    // Extract MIME type
    const mimeTypeMatch = headers.match(/content-type:\s*([^\s\r\n]+)/i);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';

    // Extract file name
    const fileNameMatch = headers.match(/filename="([^"]+)"/);
    const fileName = fileNameMatch ? fileNameMatch[1] : 'upload';

    // Get file body (skip the double CRLF after headers, and the trailing CRLF)
    const bodyStart = headerEndIndex + 4;
    const bodyEnd = part.length - 2; // Remove trailing CRLF
    const fileBuffer = part.subarray(bodyStart, bodyEnd);

    return { file: fileBuffer, mimeType, fileName };
  }

  return null;
}

function bufferSplit(haystack: Buffer, needle: Buffer): Buffer[] {
  const result: Buffer[] = [];
  let start = 0;
  while (start < haystack.length) {
    const index = haystack.indexOf(needle, start);
    if (index === -1) {
      result.push(haystack.subarray(start));
      break;
    }
    result.push(haystack.subarray(start, index));
    start = index + needle.length;
  }
  return result;
}

function findDoubleCRLF(buffer: Buffer): number {
  for (let i = 0; i < buffer.length - 3; i++) {
    if (
      buffer[i] === 0x0d &&
      buffer[i + 1] === 0x0a &&
      buffer[i + 2] === 0x0d &&
      buffer[i + 3] === 0x0a
    ) {
      return i;
    }
  }
  return -1;
}

export async function POST(request: Request) {
  try {
    const parsed = await parseMultipart(request);

    if (!parsed) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado ou formato inválido' },
        { status: 400 }
      );
    }

    const { file, mimeType, fileName } = parsed;

    // Validate file size
    if (file.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo excede o tamanho máximo de 5MB' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          error: 'Tipo de arquivo não permitido. Aceitos: JPEG, PNG, WebP',
        },
        { status: 400 }
      );
    }

    // Process image with sharp: resize and convert to WebP
    const processedImage = await sharp(file)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Generate unique filename
    const uuid = uuidv4();
    const outputFileName = `${uuid}.webp`;
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads'
    );

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file
    const outputPath = path.join(uploadDir, outputFileName);
    await fs.writeFile(outputPath, processedImage);

    // Return public URL
    const imageUrl = `/uploads/${outputFileName}`;

    return NextResponse.json(
      {
        url: imageUrl,
        fileName: outputFileName,
        originalName: fileName,
        size: processedImage.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload da imagem' },
      { status: 500 }
    );
  }
}
