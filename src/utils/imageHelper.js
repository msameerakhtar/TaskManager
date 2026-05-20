/**
 * Optimizes Cloudinary images by adding dynamic format and quality auto-transformations.
 * It also supports custom cropping and sizing.
 * 
 * @param {string} url - The original image URL.
 * @param {Object} options - Transformation options.
 * @param {number} [options.width] - Crop width.
 * @param {number} [options.height] - Crop height.
 * @param {string} [options.crop='fill'] - Cloudinary crop mode.
 * @returns {string} - Optimized image URL.
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return url;

  // Only apply to Cloudinary URLs
  if (url.includes('res.cloudinary.com')) {
    const { width, height, crop = 'fill' } = options;
    
    // Construct dynamic transformation string
    let transform = 'f_auto,q_auto';
    if (width || height) {
      transform += `,c_${crop}`;
      if (width) transform += `,w_${width}`;
      if (height) transform += `,h_${height}`;
    }

    // Insert transformation right after '/upload/' in the URL
    if (url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/${transform}/`);
    }
  }

  return url;
};
