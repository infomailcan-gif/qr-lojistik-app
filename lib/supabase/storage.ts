// Supabase Storage - Fotoğraf yükleme utility
import { supabase, isSupabaseConfigured } from "./client";

const BUCKET_NAME = "box-photos";
const PALLET_BUCKET_NAME = "pallet-photos";
const SHIPMENT_BUCKET_NAME = "shipment-photos";

/**
 * Base64 data URL'i Supabase Storage'a yükler ve public URL döner
 * @param dataUrl - base64 data URL (örn: "data:image/jpeg;base64,...")
 * @param boxCode - Koli kodu (dosya adı için)
 * @returns Public URL veya null (hata durumunda)
 */
export async function uploadBoxPhoto(
  dataUrl: string,
  boxCode: string
): Promise<string> {
  // Supabase yapılandırılmamışsa hata fırlat - base64 çok büyük veritabanına kaydedilemez
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase Storage yapılandırılmamış. Fotoğraf yüklenemedi.");
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
      throw new Error(`Fotoğraf yüklenemedi: ${error.message}`);
    }

    // Public URL al
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Photo upload error:", error);
    throw new Error(error?.message || "Fotoğraf yüklenirken bir hata oluştu");
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

/**
 * Base64 data URL'i Supabase Storage'a yükler (Palet fotoğrafı için)
 * @param dataUrl - base64 data URL (örn: "data:image/jpeg;base64,...")
 * @param palletCode - Palet kodu (dosya adı için)
 * @returns Public URL veya null (hata durumunda)
 */
export async function uploadPalletPhoto(
  dataUrl: string,
  palletCode: string
): Promise<string> {
  // Supabase yapılandırılmamışsa hata fırlat
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase Storage yapılandırılmamış. Fotoğraf yüklenemedi.");
  }

  try {
    // Base64 data URL'den blob oluştur
    const blob = await dataUrlToBlob(dataUrl);
    
    // Dosya uzantısını belirle
    const extension = getExtensionFromMimeType(blob.type);
    
    // Benzersiz dosya adı oluştur
    const timestamp = Date.now();
    const fileName = `${palletCode}-${timestamp}.${extension}`;
    
    // Supabase Storage'a yükle (box-photos bucket'ını kullan, ayrı bucket gerekli değil)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`pallets/${fileName}`, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw new Error(`Fotoğraf yüklenemedi: ${error.message}`);
    }

    // Public URL al
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Pallet photo upload error:", error);
    throw new Error(error?.message || "Fotoğraf yüklenirken bir hata oluştu");
  }
}

/**
 * Base64 data URL'i Supabase Storage'a yükler (Sevkiyat fotoğrafı için)
 * @param dataUrl - base64 data URL (örn: "data:image/jpeg;base64,...")
 * @param shipmentCode - Sevkiyat kodu (dosya adı için)
 * @returns Public URL veya null (hata durumunda)
 */
export async function uploadShipmentPhoto(
  dataUrl: string,
  shipmentCode: string
): Promise<string> {
  // Supabase yapılandırılmamışsa hata fırlat
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase Storage yapılandırılmamış. Fotoğraf yüklenemedi.");
  }

  try {
    // Base64 data URL'den blob oluştur
    const blob = await dataUrlToBlob(dataUrl);
    
    // Dosya uzantısını belirle
    const extension = getExtensionFromMimeType(blob.type);
    
    // Benzersiz dosya adı oluştur
    const timestamp = Date.now();
    const fileName = `${shipmentCode}-${timestamp}.${extension}`;
    
    // Supabase Storage'a yükle (box-photos bucket'ını kullan, ayrı bucket gerekli değil)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`shipments/${fileName}`, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw new Error(`Fotoğraf yüklenemedi: ${error.message}`);
    }

    // Public URL al
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Shipment photo upload error:", error);
    throw new Error(error?.message || "Fotoğraf yüklenirken bir hata oluştu");
  }
}

/**
 * Base64 data URL'i Supabase Storage'a yükler (Popup duyuru resmi için)
 * @param dataUrl - base64 data URL (örn: "data:image/jpeg;base64,...")
 * @returns Public URL veya null (hata durumunda)
 */
export async function uploadPopupImage(
  dataUrl: string
): Promise<string> {
  // Supabase yapılandırılmamışsa hata fırlat
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase Storage yapılandırılmamış. Resim yüklenemedi.");
  }

  try {
    // Base64 data URL'den blob oluştur
    const blob = await dataUrlToBlob(dataUrl);
    
    // Dosya uzantısını belirle
    const extension = getExtensionFromMimeType(blob.type);
    
    // Benzersiz dosya adı oluştur
    const timestamp = Date.now();
    const fileName = `popup-${timestamp}.${extension}`;
    
    // Supabase Storage'a yükle
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`popup-announcements/${fileName}`, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw new Error(`Resim yüklenemedi: ${error.message}`);
    }

    // Public URL al
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Popup image upload error:", error);
    throw new Error(error?.message || "Resim yüklenirken bir hata oluştu");
  }
}


