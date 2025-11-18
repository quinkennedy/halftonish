/**
 * Canvas I/O utilities for loading and saving images
 */

export class CanvasIO {
    /**
     * Load image file to ImageData
     * @param {File} file - Image file
     * @returns {Promise<ImageData>}
     */
    static async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => {
                reject(new Error('Failed to load image'));
                URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Save canvas to file
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {string} filename - Output filename
     * @param {string} format - Image format (png, jpeg, webp)
     * @param {number} quality - Quality for lossy formats (0-1)
     */
    static saveImage(canvas, filename, format = 'png', quality = 0.95) {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }, `image/${format}`, quality);
    }

    /**
     * Display ImageData on canvas
     * @param {ImageData} imageData - Image data
     * @param {HTMLCanvasElement} canvas - Target canvas
     */
    static displayImageData(imageData, canvas) {
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
    }
}
