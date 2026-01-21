// Supabase Storage - Fotoğraf yükleme utility
import { supabase, isSupabaseConfigured } from "./client";

const BUCKET_NAME = "box-photos";

/**
 * Base64 data URL'i Supabase Storage'a yükler ve public URL döner
 * @param dataUrl - base64 data URL (örn: "data:image/jpeg;base64,...")
 * @param boxCode - Koli kodu (dosya adı için)
 * @returns Public URL veya null (hata durumunda)
 */
export async function uploadBoxPhoto(
  dataUrl: string,
  boxCode: string
): Promise<string | null> {
  // Supabase yapılandırılmamışsa base64'ü direkt döndür (localStorage fallback)
  if (!isSupabaseConfigured || !supabase) {
    return dataUrl;
  }

  try {
    // Base64 data URL'den blob oluştur
    const blob = await dataUrlToBlob(dataUrl);
    
    // Dosya uzantısını belirle
    const extension = getExtensionFromMimeType(blob.type);
    
    // Benzersiz dosya adı oluştur
    const timestamp = Date.now();
    const fileName = `${boxCode}-${timestamp}.${extension}`;
    
    // Supabase Storage'a yükle
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      // Hata durumunda base64'ü döndür (fallback)
      return dataUrl;
    }

    // Public URL al
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Photo upload error:", error);
    // Hata durumunda base64'ü döndür (fallback)
    return dataUrl;
  }
}

/**
 * Eski fotoğrafı Storage'dan siler (opsiyonel cleanup)
 */
export async function deleteBoxPhoto(photoUrl: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  
  // Sadece Storage URL'lerini sil, base64'leri değil
  if (!photoUrl.includes(BUCKET_NAME)) return;

  try {
    // URL'den dosya yolunu çıkar
    const urlParts = photoUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];
    
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  } catch (error) {
    console.error("Photo delete error:", error);
  }
}

/**
 * Base64 data URL'i Blob'a dönüştürür
 */
function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // data:image/jpeg;base64,/9j/4AAQ... formatını parse et
      const parts = dataUrl.split(",");
      if (parts.length !== 2) {
        reject(new Error("Invalid data URL format"));
        return;
      }

      const mimeMatch = parts[0].match(/:(.*?);/);
      if (!mimeMatch) {
        reject(new Error("Could not extract MIME type"));
        return;
      }

      const mimeType = mimeMatch[1];
      const base64Data = parts[1];
      
      // Base64'ü binary'e dönüştür
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      resolve(new Blob([bytes], { type: mimeType }));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * MIME type'dan dosya uzantısı döner
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  
  return mimeToExt[mimeType] || "jpg";
}

