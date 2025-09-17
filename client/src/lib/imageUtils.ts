/**
 * Utility functions for handling image URLs
 */

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Normalize image URLs to work with the new storage structure
 * Handles both old and new URL formats
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  // If it's a base64 image, return as-is
  if (url.startsWith('data:')) {
    return url;
  }

  // If it's an external URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For API image URLs, prepend the backend URL if needed
  if (url.startsWith('/api/images/')) {
    // In production, prepend the backend URL
    if (API_BASE_URL) {
      return API_BASE_URL + url;
    }
    // In development, return as-is (same origin)
    return url;
  }

  // For any other format, return as-is
  return url;
}

/**
 * Extract the thumbnail URL from an image URL
 * Works with both old and new formats
 */
export function getThumbnailUrl(imageUrl: string, thumbnailUrl?: string | null): string {
  // If we have an explicit thumbnail URL, use it
  if (thumbnailUrl) {
    return normalizeImageUrl(thumbnailUrl);
  }

  // If the image URL is in the new format, convert to thumbnail
  const newFormatMatch = imageUrl.match(/^(\/api\/images\/[a-f0-9-]+\/)(\d+_[a-f0-9-]+)(\.png)$/);
  if (newFormatMatch) {
    // Convert: /api/images/{uuid}/123_abc.png -> /api/images/{uuid}/123_abc_thumb.png
    return `${newFormatMatch[1]}${newFormatMatch[2]}_thumb${newFormatMatch[3]}`;
  }

  // For old format or external URLs, use the image as thumbnail
  return normalizeImageUrl(imageUrl);
}

/**
 * Check if an image URL needs authentication
 */
export function needsAuth(url: string): boolean {
  // API images need authentication (except public endpoints if we add them)
  return url.startsWith('/api/images/');
}

/**
 * Get the public URL for an image if it's marked as public
 * This can be used for sharing or embedding
 */
export function getPublicImageUrl(imageId: string, imageUrl: string, isPublic: boolean): string {
  if (!isPublic) {
    return imageUrl; // Private images use regular URL
  }

  // For public images, we could use a different endpoint or add a query param
  // For now, return the same URL as the server will check the isPublic flag
  return imageUrl;
}