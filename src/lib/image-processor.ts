import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Image processing utilities for optimizing images before sending to Claude
 */
export class ImageProcessor {
  private static readonly MAX_DIMENSION = 720;
  private static readonly QUALITY = 85;

  /**
   * Resize an image to have a maximum dimension of 720px while maintaining aspect ratio
   * @param inputPath Path to the original image
   * @param outputPath Path where the resized image will be saved (optional)
   * @returns Path to the resized image
   */
  static async resizeImage(inputPath: string, outputPath?: string): Promise<string> {
    try {
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input image not found: ${inputPath}`);
      }

      // If no output path specified, create one with '_resized' suffix
      if (!outputPath) {
        const ext = path.extname(inputPath);
        const nameWithoutExt = path.basename(inputPath, ext);
        const dir = path.dirname(inputPath);
        outputPath = path.join(dir, `${nameWithoutExt}_resized${ext}`);
      }

      // Get image metadata to check current dimensions
      const metadata = await sharp(inputPath).metadata();
      const { width = 0, height = 0 } = metadata;

      console.log(`📐 Original dimensions: ${width}x${height}`);

      // Check if resizing is needed
      if (Math.max(width, height) <= this.MAX_DIMENSION) {
        console.log(`✅ Image already within size limits, copying to: ${outputPath}`);
        fs.copyFileSync(inputPath, outputPath);
        return outputPath;
      }

      // Calculate new dimensions maintaining aspect ratio
      let newWidth: number;
      let newHeight: number;

      if (width > height) {
        // Landscape: resize based on width
        newWidth = this.MAX_DIMENSION;
        newHeight = Math.round((height * this.MAX_DIMENSION) / width);
      } else {
        // Portrait: resize based on height
        newHeight = this.MAX_DIMENSION;
        newWidth = Math.round((width * this.MAX_DIMENSION) / height);
      }

      console.log(`🔄 Resizing to: ${newWidth}x${newHeight}`);

      // Resize and optimize the image
      await sharp(inputPath)
        .resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: true,
        })
        .jpeg({ 
          quality: this.QUALITY,
          progressive: true,
          mozjpeg: true
        })
        .toFile(outputPath);

      // Get file size information
      const originalSize = fs.statSync(inputPath).size;
      const newSize = fs.statSync(outputPath).size;
      const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

      console.log(`💾 File size: ${this.formatBytes(originalSize)} → ${this.formatBytes(newSize)} (${savings}% reduction)`);

      return outputPath;
    } catch (error) {
      console.error(`❌ Error resizing image ${inputPath}:`, error);
      throw error;
    }
  }

  /**
   * Resize multiple images in a directory
   * @param inputDir Directory containing images to resize
   * @param outputDir Directory where resized images will be saved
   * @returns Array of paths to resized images
   */
  static async resizeImagesInDirectory(inputDir: string, outputDir?: string): Promise<string[]> {
    if (!outputDir) {
      outputDir = inputDir; // Resize in place if no output directory specified
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const files = fs.readdirSync(inputDir);
    const resizedImages: string[] = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);
        
        try {
          const resizedPath = await this.resizeImage(inputPath, outputPath);
          resizedImages.push(resizedPath);
        } catch (error) {
          console.error(`❌ Failed to resize ${file}:`, error);
        }
      }
    }

    return resizedImages;
  }

  /**
   * Check if an image needs resizing
   * @param imagePath Path to the image
   * @returns true if image needs resizing
   */
  static async needsResizing(imagePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(imagePath).metadata();
      const { width = 0, height = 0 } = metadata;
      return Math.max(width, height) > this.MAX_DIMENSION;
    } catch (error) {
      console.error(`❌ Error checking image dimensions:`, error);
      return false;
    }
  }

  /**
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
