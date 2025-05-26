// src/hooks/useMaterialUpload.ts
import { useState } from 'react';
import { getUploadUrl, uploadFileToStorage, createMaterialRecord } from '@/lib/materialApi';
import type { MaterialMetadata, MaterialType } from '@/lib/materialApi';

export function useMaterialUpload(lessonId: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File, type: MaterialType) {
    setUploading(true);
    setError(null);
    try {
      // 1. Pedir URLs
      const { uploadUrl, downloadUrl } = await getUploadUrl(lessonId, file);

      // 2. Subir al bucket
      await uploadFileToStorage(uploadUrl, file);

      // 3. Recopilar metadatos
      const metadata: MaterialMetadata = {
        size: file.size,
        mimeType: file.type,
      };
      if (type === 'video' || type === 'audio') {
        // para video/audio sacas duration
        const el = document.createElement(type);
        el.src = downloadUrl;
        await new Promise<void>((res) => {
          el.addEventListener('loadedmetadata', () => {
            metadata.duration = el.duration;
            res();
          });
        });
      }

      // 4. Registrar el documento en Firestore
      const { id } = await createMaterialRecord(lessonId, type, downloadUrl, metadata);
      return id;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
