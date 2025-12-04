/**
 * Canvas-based image upscaler for improving low-quality thumbnails
 * Uses browser's built-in image smoothing for free upscaling
 */

export const upscaleImage = (
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Fallback to original if canvas context unavailable
      resolve(img.src);
      return;
    }

    // Set target dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Multi-step upscaling for better quality (progressive scaling)
    const originalWidth = img.naturalWidth || img.width;
    const originalHeight = img.naturalHeight || img.height;
    
    // If image is very small, do progressive upscaling in steps
    if (originalWidth < targetWidth / 2 || originalHeight < targetHeight / 2) {
      // Create intermediate canvas for progressive scaling
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // First step: scale to 2x original
        const step1Width = Math.min(originalWidth * 2, targetWidth);
        const step1Height = Math.min(originalHeight * 2, targetHeight);
        
        tempCanvas.width = step1Width;
        tempCanvas.height = step1Height;
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(img, 0, 0, step1Width, step1Height);
        
        // Final step: scale to target size
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
      } else {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }
    } else {
      // Direct scaling for reasonably sized images
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    }

    // Apply subtle sharpening filter via contrast
    try {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imageData.data;
      
      // Simple unsharp mask approximation
      for (let i = 0; i < data.length; i += 4) {
        // Slightly increase contrast for perceived sharpness
        const factor = 1.1;
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));     // R
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // G
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // B
      }
      
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      // If security error (CORS), skip sharpening
      console.log('Skipping sharpening due to CORS');
    }

    resolve(canvas.toDataURL('image/png', 1.0));
  });
};

/**
 * Check if an image needs upscaling based on its dimensions
 */
export const needsUpscaling = (
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): boolean => {
  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;
  
  // Upscale if original is less than 75% of target size
  return originalWidth < targetWidth * 0.75 || originalHeight < targetHeight * 0.75;
};
