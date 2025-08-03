import { Dropbox } from 'dropbox';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

export interface DropboxImageInfo {
  name: string;
  path: string;
  localPath: string;
}

/**
 * Dropbox service for fetching product images
 */
export class DropboxService {
  private dbx: Dropbox;

  constructor() {
    const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN is required');
    }

    this.dbx = new Dropbox({ 
      accessToken,
      fetch: fetch as any
    });
  }

  /**
   * List all image files in a Dropbox folder
   */
  async listImages(folderPath: string = ''): Promise<DropboxImageInfo[]> {
    try {
      console.log(`📂 Listing images from Dropbox folder: ${folderPath || '/'}`);
      
      const response = await this.dbx.filesListFolder({
        path: folderPath,
        recursive: true
      });

      const images: DropboxImageInfo[] = [];
      
      for (const entry of response.result.entries) {
        if (entry['.tag'] === 'file' && this.isImageFile(entry.name)) {
          images.push({
            name: entry.name,
            path: entry.path_lower || entry.path_display || '',
            localPath: this.getLocalPath(entry.path_display || entry.name)
          });
        }
      }

      console.log(`📸 Found ${images.length} images in Dropbox`);
      return images;
    } catch (error) {
      console.error('❌ Error listing Dropbox images:', error);
      throw error;
    }
  }

  /**
   * Download an image from Dropbox to local temp directory
   */
  async downloadImage(dropboxPath: string, localPath: string): Promise<string> {
    try {
      console.log(`⬇️ Downloading: ${dropboxPath}`);
      
      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Download file
      const response = await this.dbx.filesDownload({ path: dropboxPath });
      
      // Extract the file binary from the response
      // The response.result contains both metadata and fileBinary
      const result = response.result as any;
      
      if (!result.fileBinary) {
        throw new Error('No fileBinary found in Dropbox response');
      }
      
      // Convert fileBinary to Buffer
      const fileBuffer = Buffer.from(result.fileBinary);
      fs.writeFileSync(localPath, fileBuffer);
      
      console.log(`✅ Downloaded to: ${localPath}`);
      return localPath;
    } catch (error) {
      console.error(`❌ Error downloading ${dropboxPath}:`, error);
      throw error;
    }
  }

  /**
   * Download all images and organize by folder structure
   */
  async downloadAllImages(targetDir: string = './temp-images', folderPath: string = ''): Promise<{ [folder: string]: string[] }> {
    try {
      const images = await this.listImages(folderPath);
      const organizedImages: { [folder: string]: string[] } = {};

      for (const image of images) {
        const localPath = path.join(targetDir, image.localPath);
        await this.downloadImage(image.path, localPath);
        
        // Organize by folder (parent directory name)
        const folder = path.dirname(image.localPath).split('/')[0] || 'root';
        if (!organizedImages[folder]) {
          organizedImages[folder] = [];
        }
        organizedImages[folder].push(localPath);
      }

      console.log(`📦 Organized images into ${Object.keys(organizedImages).length} folders`);
      return organizedImages;
    } catch (error) {
      console.error('❌ Error downloading all images:', error);
      throw error;
    }
  }

  /**
   * Clean up downloaded images
   */
  cleanupTempImages(tempDir: string = './temp-images'): void {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up temp directory: ${tempDir}`);
      }
    } catch (error) {
      console.error('⚠️ Error cleaning up temp images:', error);
    }
  }

  /**
   * Check if file is an image based on extension
   */
  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * Convert Dropbox path to local path structure
   */
  private getLocalPath(dropboxPath: string): string {
    // Remove leading slash and normalize path
    return dropboxPath.startsWith('/') ? dropboxPath.slice(1) : dropboxPath;
  }
}
