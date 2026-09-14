/**
 * Image processing utilities for AI Photo Solver: Rotation, Cropping, & Format Validation
 * Integrated with Enterprise Zero-Trust Upload Inspector
 */

import { SecurityService, FileValidationResult } from '../services/securityService';

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // Strict 5MB limit

export interface CropRect {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
}

/**
 * Validate image file type and size (synchronous basic check)
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const mime = file.type.toLowerCase();
  const isSupported = SUPPORTED_IMAGE_TYPES.some((t) => mime === t || (t === 'image/jpg' && mime === 'image/jpeg'));
  if (!isSupported) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File size too large. Maximum allowed size is 5MB.',
    };
  }

  return { valid: true };
}

/**
 * Deep async file validation with magic bytes inspection and dimension boundaries
 */
export async function validateImageFileDeep(file: File): Promise<FileValidationResult> {
  return await SecurityService.validateUploadFile(file, 'image');
}

/**
 * Rotate image base64 data URL clockwise by given angle (90, 180, 270)
 */
export function rotateImageBase64(dataUrl: string, degrees: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      const rad = (degrees * Math.PI) / 180;
      const is90or270 = degrees === 90 || degrees === 270 || degrees === -90 || degrees === -270;

      canvas.width = is90or270 ? img.height : img.width;
      canvas.height = is90or270 ? img.width : img.height;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

/**
 * Crop image base64 data URL based on percentage crop rectangle
 */
export function cropImageBase64(dataUrl: string, crop: CropRect): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      const sourceX = (crop.x / 100) * img.width;
      const sourceY = (crop.y / 100) * img.height;
      const sourceW = (crop.width / 100) * img.width;
      const sourceH = (crop.height / 100) * img.height;

      canvas.width = Math.max(1, sourceW);
      canvas.height = Math.max(1, sourceH);

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        canvas.width,
        canvas.height
      );

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}
