import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

interface ImageDimensions {
  width: number;
  height: number;
}

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: "jpeg" | "png" | "webp";
  enableCompression?: boolean;
}

export class ImageOptimizer {
  // Default optimization settings
  private static defaultOptions: OptimizationOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: "jpeg",
    enableCompression: true,
  };

  /**
   * Get image dimensions without loading the full image
   */
  static async getImageDimensions(
    uri: string
  ): Promise<ImageDimensions | null> {
    try {
      if (Platform.OS === "web") {
        // Web implementation using Image element
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({ width: img.width, height: img.height });
          };
          img.onerror = () => resolve(null);
          img.src = uri;
        });
      } else {
        // Native implementation using expo-image-manipulator
        const ImageManipulator = await import("expo-image-manipulator");
        const result = await ImageManipulator.manipulateAsync(uri, [], {
          format: ImageManipulator.SaveFormat.JPEG,
        });

        // The result includes dimensions
        if (result.width && result.height) {
          return { width: result.width, height: result.height };
        }
        return null;
      }
    } catch (error) {
      console.error("Error getting image dimensions:", error);
      return null;
    }
  }

  /**
   * Check if image needs optimization
   */
  static async needsOptimization(
    uri: string,
    options: Partial<OptimizationOptions> = {}
  ): Promise<boolean> {
    const dims = await this.getImageDimensions(uri);
    if (!dims) return false;

    const opts = { ...this.defaultOptions, ...options };

    return (
      dims.width > (opts.maxWidth || 1920) ||
      dims.height > (opts.maxHeight || 1920)
    );
  }

  /**
   * Optimize an image
   */
  static async optimize(
    uri: string,
    options: Partial<OptimizationOptions> = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Get current dimensions
      const dims = await this.getImageDimensions(uri);
      if (!dims) {
        console.warn("Could not get image dimensions, returning original");
        return uri;
      }

      // Calculate new dimensions maintaining aspect ratio
      const { width: newWidth, height: newHeight } = this.calculateDimensions(
        dims.width,
        dims.height,
        opts.maxWidth,
        opts.maxHeight
      );

      // If dimensions haven't changed, return original
      if (
        newWidth === dims.width &&
        newHeight === dims.height &&
        opts.quality === 1
      ) {
        return uri;
      }

      // Perform manipulation
      if (Platform.OS !== "web") {
        const ImageManipulator = await import("expo-image-manipulator");

        const manipulations = [
          { resize: { width: newWidth, height: newHeight } },
        ];
        const format = this.getExpoFormat(opts.format);

        const result = await ImageManipulator.manipulateAsync(
          uri,
          manipulations,
          {
            format,
            compress: opts.quality || 0.8,
            base64: false,
          }
        );

        console.log(
          `Image optimized: ${dims.width}x${dims.height} → ${newWidth}x${newHeight}`
        );
        return result.uri;
      } else {
        // Web optimization using canvas
        return this.optimizeWebImage(uri, newWidth, newHeight, opts);
      }
    } catch (error) {
      console.error("Error optimizing image:", error);
      return uri;
    }
  }

  /**
   * Optimize multiple images in parallel
   */
  static async optimizeMultiple(
    uris: string[],
    options: Partial<OptimizationOptions> = {}
  ): Promise<string[]> {
    const promises = uris.map((uri) => this.optimize(uri, options));
    return Promise.all(promises);
  }

  /**
   * Get file size in MB
   */
  static async getFileSize(uri: string): Promise<number> {
    try {
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        return blob.size / (1024 * 1024); // Convert to MB
      } else {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists && 'size' in info) {
          return (info.size || 0) / (1024 * 1024); // Convert to MB
        }
        return 0;
      }
    } catch (error) {
      console.error("Error getting file size:", error);
      return 0;
    }
  }

  /**
   * Resize image to fit within max dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    width: number,
    height: number,
    maxWidth?: number,
    maxHeight?: number
  ): { width: number; height: number } {
    if (!maxWidth && !maxHeight) {
      return { width, height };
    }

    const maxW = maxWidth || width;
    const maxH = maxHeight || height;

    if (width <= maxW && height <= maxH) {
      return { width, height };
    }

    const aspectRatio = width / height;
    let newWidth = width;
    let newHeight = height;

    if (width > maxW) {
      newWidth = maxW;
      newHeight = maxW / aspectRatio;
    }

    if (newHeight > maxH) {
      newHeight = maxH;
      newWidth = maxH * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  /**
   * Convert format string to Expo format
   */
  private static getExpoFormat(format?: string): any {
    const ImageManipulator = require("expo-image-manipulator");

    switch (format) {
      case "png":
        return ImageManipulator.SaveFormat.PNG;
      case "webp":
        // WebP might not be supported on all platforms
        try {
          return ImageManipulator.SaveFormat.WEBP;
        } catch {
          return ImageManipulator.SaveFormat.JPEG;
        }
      default:
        return ImageManipulator.SaveFormat.JPEG;
    }
  }

  /**
   * Web image optimization using canvas
   */
  private static async optimizeWebImage(
    uri: string,
    width: number,
    height: number,
    options: OptimizationOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error("Could not compress image"));
            }
          },
          `image/${options.format || "jpeg"}`,
          options.quality || 0.8
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = uri;
    });
  }

  /**
   * Generate thumbnail
   */
  static async generateThumbnail(
    uri: string,
    size: number = 200
  ): Promise<string> {
    return this.optimize(uri, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: "jpeg",
    });
  }

  /**
   * Convert image to base64 (for uploading)
   */
  static async toBase64(uri: string): Promise<string> {
    try {
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });

        // Detect mime type
        const extension = uri.split(".").pop()?.toLowerCase();
        const mimeType = this.getMimeType(extension);

        return `data:${mimeType};base64,${base64}`;
      }
    } catch (error) {
      console.error("Error converting to base64:", error);
      throw error;
    }
  }

  private static getMimeType(extension?: string): string {
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      default:
        return "image/jpeg";
    }
  }
}

// Export convenience functions
export const optimizeImage = ImageOptimizer.optimize.bind(ImageOptimizer);
export const generateThumbnail =
  ImageOptimizer.generateThumbnail.bind(ImageOptimizer);
export const getImageDimensions =
  ImageOptimizer.getImageDimensions.bind(ImageOptimizer);
export const getFileSize = ImageOptimizer.getFileSize.bind(ImageOptimizer);
