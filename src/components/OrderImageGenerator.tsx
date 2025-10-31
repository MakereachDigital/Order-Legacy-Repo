import { useRef, useEffect, useState } from "react";
import { Product } from "@/types/product";
import { Download, X } from "lucide-react";
import { Button } from "./ui/button";

interface OrderImageGeneratorProps {
  selectedProducts: Product[];
  onClose: () => void;
}

export const OrderImageGenerator = ({ selectedProducts, onClose }: OrderImageGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    generateOrderImage();
  }, [selectedProducts]);

  const generateOrderImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || selectedProducts.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate grid dimensions
    const itemsPerRow = Math.min(2, selectedProducts.length);
    const rows = Math.ceil(selectedProducts.length / itemsPerRow);
    const imgSize = 300;
    const padding = 20;
    const textHeight = 60;

    canvas.width = itemsPerRow * imgSize + (itemsPerRow + 1) * padding;
    canvas.height = rows * (imgSize + textHeight) + (rows + 1) * padding;

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw images
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      const images = await Promise.all(
        selectedProducts.map(product => loadImage(product.image))
      );

      images.forEach((img, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = col * imgSize + (col + 1) * padding;
        const y = row * (imgSize + textHeight) + (row + 1) * padding;

        // Draw image with rounded corners
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, imgSize, imgSize, 16);
        ctx.clip();
        ctx.drawImage(img, x, y, imgSize, imgSize);
        ctx.restore();

        // Draw border
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, imgSize, imgSize, 16);
        ctx.stroke();

        // Draw text
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          selectedProducts[index].name,
          x + imgSize / 2,
          y + imgSize + 40
        );
      });

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
      }, "image/png");
    } catch (error) {
      console.error("Error generating order image:", error);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = `order-${Date.now()}.png`;
    link.href = imageUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Order Image</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Image preview */}
        <div className="flex-1 flex items-center justify-center overflow-auto">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Order preview" 
              className="max-w-full max-h-full rounded-lg shadow-2xl"
            />
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <Button 
            onClick={handleDownload} 
            className="flex-1"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Image
          </Button>
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
