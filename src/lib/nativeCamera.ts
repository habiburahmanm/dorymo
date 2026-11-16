/**
 * NID photo capture: camera on the native app, file picker on the website.
 * The returned File is uploaded to the private Supabase `nid-documents` bucket
 * by masterDb.uploadNidPhoto() — identical flow on both platforms.
 */
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const isNativeApp = Capacitor.isNativePlatform();

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

/** Generic camera/gallery capture on native; null on web (use file input). */
export async function capturePhoto(prefix: string, width = 1400): Promise<File | null> {
  if (!isNativeApp) return null;
  try {
    const photo = await Camera.getPhoto({
      quality: 82,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Camera / Photo library choice
      correctOrientation: true,
      width,
    });
    if (!photo.dataUrl) return null;
    return dataUrlToFile(photo.dataUrl, `${prefix}-${Date.now()}.${photo.format || 'jpeg'}`);
  } catch {
    // user cancelled -> no file
    return null;
  }
}

/** Returns null on web (caller opens the hidden <input type=file>). */
export async function captureNidPhoto(): Promise<File | null> {
  return capturePhoto('nid', 1400);
}
