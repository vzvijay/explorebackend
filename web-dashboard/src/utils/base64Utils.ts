import { Base64ImageData, ImageUploadResult } from '../types';

/**
 * Convert a File object to base64 string
 */
export const fileToBase64 = (file: File): Promise<Base64ImageData> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      reject(new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      
      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64Data = result.split(',')[1];
      
      resolve({
        data: base64Data,
        size: file.size,
        type: file.type,
        filename: file.name
      });
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Validate base64 string format
 */
export const validateBase64 = (base64String: string): boolean => {
  try {
    // Check if it's a valid base64 string
    const regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return regex.test(base64String);
  } catch {
    return false;
  }
};

/**
 * Get file size from base64 string
 */
export const getBase64Size = (base64String: string): number => {
  try {
    // Base64 is approximately 33% larger than binary
    // Each character represents 6 bits, so 4 characters = 3 bytes
    const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
    return Math.floor((base64String.length * 3) / 4) - padding;
  } catch {
    return 0;
  }
};

/**
 * Convert base64 string to Blob for download
 */
export const base64ToBlob = (base64String: string, mimeType: string = 'image/jpeg'): Blob => {
  try {
    // Convert base64 to binary
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw new Error('Failed to convert image data');
  }
};

/**
 * Download base64 image as file
 */
export const downloadBase64Image = (
  base64String: string, 
  filename: string, 
  mimeType: string = 'image/jpeg'
): void => {
  try {
    const blob = base64ToBlob(base64String, mimeType);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download image');
  }
};

/**
 * Create a preview URL from base64 string
 */
export const createBase64PreviewUrl = (base64String: string, mimeType: string = 'image/jpeg'): string => {
  return `data:${mimeType};base64,${base64String}`;
};

/**
 * Compress base64 image to reduce size
 */
export const compressBase64Image = (
  base64String: string, 
  quality: number = 0.8, 
  maxWidth: number = 1920
): Promise<Base64ImageData> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Extract base64 data
        const base64Data = compressedBase64.split(',')[1];
        
        resolve({
          data: base64Data,
          size: getBase64Size(base64Data),
          type: 'image/jpeg',
          filename: 'compressed_image.jpg'
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Create full data URL for image loading
      const fullDataUrl = createBase64PreviewUrl(base64String, 'image/jpeg');
      img.src = fullDataUrl;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Check if base64 string is valid image data
 */
export const isValidImageBase64 = (base64String: string): boolean => {
  try {
    // Check if it's a valid base64 string
    if (!validateBase64(base64String)) {
      return false;
    }

    // Check if it's reasonable size (not too small, not too large)
    const size = getBase64Size(base64String);
    const minSize = 1024; // 1KB minimum
    const maxSize = 10 * 1024 * 1024; // 10MB maximum

    return size >= minSize && size <= maxSize;
  } catch {
    return false;
  }
};

/**
 * Get MIME type from base64 data URL
 */
export const getMimeTypeFromBase64 = (base64String: string): string => {
  try {
    // If it's a full data URL, extract MIME type
    if (base64String.startsWith('data:')) {
      const match = base64String.match(/^data:([^;]+);/);
      return match ? match[1] : 'image/jpeg';
    }
    
    // Default to JPEG if no MIME type specified
    return 'image/jpeg';
  } catch {
    return 'image/jpeg';
  }
};
