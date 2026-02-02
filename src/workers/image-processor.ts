interface ProcessImageRequest {
  file: ArrayBuffer;
  maxWidth: number;
  quality: number;
  format: 'webp' | 'jpeg';
  type: string;
}

interface ProcessImageResult {
  blob: Blob;
  width: number;
  height: number;
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<ProcessImageRequest>) => {
  try {
    const result = await processImage(event.data);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

async function processImage(
  request: ProcessImageRequest
): Promise<ProcessImageResult> {
  const { file, maxWidth, quality, format, type } = request;

  // Create blob from array buffer
  let blob = new Blob([file], { type });

  // Convert HEIC to JPEG if needed
  if (type === 'image/heic' || type === 'image/heif') {
    blob = await convertHeicToJpeg(blob);
  }

  // Create image bitmap
  const imageBitmap = await createImageBitmap(blob);

  // Calculate new dimensions
  let { width, height } = imageBitmap;
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  // Create offscreen canvas
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw resized image
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Export to blob
  const outputBlob = await canvas.convertToBlob({
    type: format === 'webp' ? 'image/webp' : 'image/jpeg',
    quality,
  });

  return {
    blob: outputBlob,
    width,
    height,
  };
}

async function convertHeicToJpeg(blob: Blob): Promise<Blob> {
  // In a worker, we can't easily use heic2any library
  // Instead, we'll try to use the browser's native decoding
  try {
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(
      imageBitmap.width,
      imageBitmap.height
    );
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context for HEIC conversion');
    }

    ctx.drawImage(imageBitmap, 0, 0);
    return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
  } catch {
    // If native decoding fails, throw an error
    // Main thread should handle this with heic2any
    throw new Error('HEIC_CONVERSION_NEEDED');
  }
}

export type { ProcessImageRequest, ProcessImageResult };
