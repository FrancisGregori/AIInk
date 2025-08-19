import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';

export class ImageStorage {
  private imageDir: string;

  constructor() {
    this.imageDir = join(process.cwd(), 'public', 'images');
    this.ensureImageDirExists();
  }

  private ensureImageDirExists() {
    if (!existsSync(this.imageDir)) {
      mkdirSync(this.imageDir, { recursive: true });
    }
  }

  saveImage(imageBuffer: Buffer): string {
    const fileName = `${nanoid()}.png`;
    const filePath = join(this.imageDir, fileName);
    
    try {
      writeFileSync(filePath, imageBuffer);
      return `/images/${fileName}`;
    } catch (error) {
      console.error('Error saving image:', error);
      // Fallback to base64 if file system fails
      const base64 = imageBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    }
  }

  getImage(fileName: string): Buffer | null {
    const filePath = join(this.imageDir, fileName);
    
    try {
      if (existsSync(filePath)) {
        return readFileSync(filePath);
      }
    } catch (error) {
      console.error('Error reading image:', error);
    }
    
    return null;
  }
}

export const imageStorage = new ImageStorage();
