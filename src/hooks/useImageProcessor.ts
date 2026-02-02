import { useCallback, useRef } from 'react';
import heic2any from 'heic2any';

interface ProcessedImage {
  main: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
}

export function useImageProcessor() {
  const workerRef = useRef<Worker | null>(null);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/image-processor.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return workerRef.current;
  }, []);

  const processWithWorker = useCallback(
    async (
      file: File,
      maxWidth: number,
      quality: number,
      format: 'webp' | 'jpeg'
    ): Promise<{ blob: Blob; width: number; height: number }> => {
      const worker = getWorker();
      const arrayBuffer = await file.arrayBuffer();

      return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          worker.removeEventListener('message', handleMessage);

          if (event.data.success) {
            resolve(event.data.result);
          } else {
            reject(new Error(event.data.error));
          }
        };

        worker.addEventListener('message', handleMessage);

        worker.postMessage({
          file: arrayBuffer,
          maxWidth,
          quality,
          format,
          type: file.type,
        });
      });
    },
    [getWorker]
  );

  const processImage = useCallback(
    async (file: File): Promise<ProcessedImage> => {
      let processableFile = file;

      // Handle HEIC files
      if (
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif')
      ) {
        try {
          const convertedBlob = (await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.95,
          })) as Blob;

          processableFile = new File(
            [convertedBlob],
            file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
        } catch (error) {
          console.error('HEIC conversion failed:', error);
          throw new Error('Could not convert HEIC image');
        }
      }

      // Process main image (max 1920px, quality 0.75)
      const mainResult = await processWithWorker(
        processableFile,
        1920,
        0.75,
        'webp'
      );

      // Process thumbnail (max 400px, quality 0.6)
      const thumbResult = await processWithWorker(
        processableFile,
        400,
        0.6,
        'webp'
      );

      return {
        main: mainResult.blob,
        thumbnail: thumbResult.blob,
        width: mainResult.width,
        height: mainResult.height,
      };
    },
    [processWithWorker]
  );

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    processImage,
    terminate,
  };
}
