import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert base64 string to Blob for downloads
 * Optimized for large 4K images
 */
export function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
  // Remove data URI prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

  // Decode base64 to binary string
  const binaryString = atob(base64Data);
  const length = binaryString.length;

  // Use Uint8Array for efficient memory usage with large images
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

/**
 * Download base64 image as a file
 * Handles cleanup of object URLs
 */
export function downloadBase64Image(base64: string, filename: string): void {
  const blob = base64ToBlob(base64);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy image to clipboard
 * Works with base64 data
 */
export async function copyImageToClipboard(base64: string): Promise<void> {
  try {
    const blob = base64ToBlob(base64);
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
  } catch (error) {
    throw new Error('Failed to copy image to clipboard');
  }
}

/**
 * Validate image URL accessibility and format
 * Returns true if URL is valid and points to an image
 */
export async function validateImageUrl(url: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }

    // Check if URL is accessible and is an image
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return { valid: false, error: `URL not accessible (HTTP ${response.status})` };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return { valid: false, error: 'URL does not point to an image' };
    }

    // Check if it's a supported format
    const supportedFormats = ['image/jpeg', 'image/png'];
    if (!supportedFormats.some((format) => contentType.includes(format))) {
      return { valid: false, error: 'Only JPEG and PNG formats are supported' };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return { valid: false, error: 'URL validation timed out' };
    }
    return { valid: false, error: 'Failed to validate URL' };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format generation time for display
 */
export function formatGenerationTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Estimate base64 image size in bytes
 * Useful for displaying image size to user
 */
export function estimateBase64Size(base64: string): number {
  // Remove data URI prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

  // Base64 encoding increases size by ~33%
  // Estimate original size by decoding length
  return Math.ceil((base64Data.length * 3) / 4);
}
