import { useRef, useEffect, useState } from "react";
import { Product } from "@/types/product";
import { Download, X, MessageCircle, Send } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface OrderImageGeneratorProps {
  selectedProducts: Product[];
  onClose: () => void;
}

export const OrderImageGenerator = ({ selectedProducts, onClose }: OrderImageGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (selectedProducts.length > 0) {
      generateOrderImage();
    }
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
    const textHeight = 80;

    canvas.width = itemsPerRow * imgSize + (itemsPerRow + 1) * padding;
    canvas.height = rows * (imgSize + textHeight) + (rows + 1) * padding;

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load images through proxy to avoid CORS
    const loadImage = async (src: string): Promise<HTMLImageElement> => {
      try {
        console.log("Fetching image through proxy:", src);
        
        // Use edge function proxy to fetch the image
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: src }),
          }
        );

        if (!response.ok) {
          throw new Error(`Proxy request failed: ${response.status}`);
        }

        const { dataUrl, error } = await response.json();
        
        if (error) {
          throw new Error(error);
        }
        
        // Load the data URL into an image
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            console.log("Image loaded successfully:", src);
            resolve(img);
          };
          img.onerror = (e) => {
            console.error("Failed to load image:", src, e);
            reject(new Error(`Failed to load image: ${src}`));
          };
          img.src = dataUrl;
        });
      } catch (error) {
        console.error("Failed to fetch image:", src, error);
        throw new Error(`Failed to fetch image: ${src}`);
      }
    };

    try {
      console.log("Starting to load images for", selectedProducts.length, "products");
      const images = await Promise.all(
        selectedProducts.map(product => loadImage(product.image))
      );
      console.log("All images loaded successfully");

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
        ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        
        // Product name
        const name = selectedProducts[index].name;
        ctx.fillText(name, x + imgSize / 2, y + imgSize + 30);
        
        // Price
        if (selectedProducts[index].price) {
          ctx.font = "16px system-ui, -apple-system, sans-serif";
          ctx.fillStyle = "#059669";
          ctx.fillText(
            selectedProducts[index].price!,
            x + imgSize / 2,
            y + imgSize + 55
          );
        }
      });

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          console.log("Image generated successfully, URL:", url);
          setImageUrl(url);
        } else {
          console.error("Failed to create blob from canvas");
          toast.error("Failed to generate image");
        }
      }, "image/png");
    } catch (error) {
      console.error("Error generating order image:", error);
      toast.error("Failed to generate order image. Please try again.");
    }
  };

  const handleDownload = () => {
    if (!imageUrl) {
      toast.error("Image not ready yet");
      return;
    }
    const link = document.createElement("a");
    link.download = `order-${Date.now()}.png`;
    link.href = imageUrl;
    link.click();
    toast.success("Image downloaded successfully!");
  };

  const handleWhatsAppShare = async () => {
    if (!imageUrl) {
      toast.error("Image not ready yet");
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `order-${Date.now()}.png`, { type: "image/png" });

      // Try Web Share API first (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Order Image",
          text: `Order: ${selectedProducts.map(p => p.name).join(", ")}`,
        });
        toast.success("Sharing to WhatsApp...");
      } else {
        // Desktop fallback: Download image and open WhatsApp Web
        const link = document.createElement("a");
        link.download = `order-${Date.now()}.png`;
        link.href = imageUrl;
        link.click();
        
        // Small delay to ensure download starts
        setTimeout(() => {
          const text = `Order: ${selectedProducts.map(p => p.name).join(", ")}`;
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
          window.open(whatsappUrl, "_blank");
          toast.success("Image downloaded! Please attach it in WhatsApp");
        }, 500);
      }
    } catch (error) {
      console.error("Error sharing to WhatsApp:", error);
      toast.error("Failed to share. Please try the download button.");
    }
  };

  const handleMessengerShare = async () => {
    if (!imageUrl) {
      toast.error("Image not ready yet");
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `order-${Date.now()}.png`, { type: "image/png" });

      // Try Web Share API first (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Order Image",
          text: `Order: ${selectedProducts.map(p => p.name).join(", ")}`,
        });
        toast.success("Sharing to Messenger...");
      } else {
        // Desktop fallback: Download image and open Messenger
        const link = document.createElement("a");
        link.download = `order-${Date.now()}.png`;
        link.href = imageUrl;
        link.click();
        
        // Small delay to ensure download starts
        setTimeout(() => {
          const messengerUrl = `https://www.facebook.com/messages/t/`;
          window.open(messengerUrl, "_blank");
          toast.success("Image downloaded! Please attach it in Messenger");
        }, 500);
      }
    } catch (error) {
      console.error("Error sharing to Messenger:", error);
      toast.error("Failed to share. Please try the download button.");
    }
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
        <div className="mt-4 flex flex-col gap-3">
          <Button 
            onClick={handleDownload} 
            className="w-full"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download
          </Button>
          <div className="flex gap-3">
            <Button 
              onClick={handleWhatsAppShare} 
              className="flex-1"
              size="lg"
              variant="secondary"
            >
              <Send className="mr-2 h-5 w-5" />
              WhatsApp
            </Button>
            <Button 
              onClick={handleMessengerShare} 
              className="flex-1"
              size="lg"
              variant="secondary"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Messenger
            </Button>
          </div>
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
