import { useRef, useEffect, useState } from "react";
import { Product } from "@/types/product";
import { Download, X, MessageCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { upscaleImage, needsUpscaling } from "@/lib/imageUpscaler";

interface OrderImageGeneratorProps {
  selectedProducts: Product[];
  onClose: () => void;
  onResetSelection: () => void;
  initialReceiptFile?: File | null;
  initialReceiptPreview?: string;
}

export const OrderImageGenerator = ({ 
  selectedProducts, 
  onClose,
  onResetSelection,
  initialReceiptFile,
  initialReceiptPreview 
}: OrderImageGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(initialReceiptFile || null);
  const [receiptPreview, setReceiptPreview] = useState<string>(initialReceiptPreview || "");

  useEffect(() => {
    if (selectedProducts.length > 0) {
      generateOrderImage();
    }
  }, [selectedProducts]);

  useEffect(() => {
    // Auto-populate receipt if provided
    if (initialReceiptFile) {
      setReceiptFile(initialReceiptFile);
    }
    if (initialReceiptPreview) {
      setReceiptPreview(initialReceiptPreview);
    }
  }, [initialReceiptFile, initialReceiptPreview]);

  const generateOrderImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || selectedProducts.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsGenerating(true);

    // Calculate grid dimensions with higher resolution
    const itemsPerRow = Math.min(2, selectedProducts.length);
    const rows = Math.ceil(selectedProducts.length / itemsPerRow);
    const imgSize = 600; // Doubled for higher quality
    const padding = 40; // Doubled for proportional spacing
    const textHeight = 160; // Doubled for proportional spacing

    canvas.width = itemsPerRow * imgSize + (itemsPerRow + 1) * padding;
    canvas.height = rows * (imgSize + textHeight) + (rows + 1) * padding;

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load images - use direct loading for local/data URLs, proxy only for external URLs
    const loadImage = async (src: string): Promise<HTMLImageElement> => {
      // Check if it's a local asset or data URL (no CORS issues)
      const isLocalOrDataUrl = src.startsWith('data:') || 
                                src.startsWith('/') || 
                                src.startsWith('blob:') ||
                                !src.startsWith('http');
      
      if (isLocalOrDataUrl) {
        // Direct load for local images
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
          img.src = src;
        });
      }
      
      // For external URLs, try direct load first, then proxy
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = async () => {
          // Fallback to proxy for CORS-blocked images
          try {
            const { data, error } = await supabase.functions.invoke("image-proxy", {
              body: { imageUrl: src },
            });
            if (error) throw error;

            const dataUrl = (data as any)?.dataUrl as string | undefined;
            if (!dataUrl) throw new Error("Proxy failed");

            const proxyImg = new Image();
            proxyImg.onload = () => resolve(proxyImg);
            proxyImg.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            proxyImg.src = dataUrl;
          } catch {
            reject(new Error(`Failed to load image: ${src}`));
          }
        };
        img.src = src;
      });
    };

    try {
      console.log("Starting to load images for", selectedProducts.length, "products");
      const loadedImages = await Promise.all(
        selectedProducts.map(product => loadImage(product.image))
      );
      
      // Upscale low-quality images for better thumbnails
      const targetSize = imgSize; // 600px target
      const images: HTMLImageElement[] = [];
      
      for (const img of loadedImages) {
        if (needsUpscaling(img, targetSize, targetSize)) {
          console.log("Upscaling low-quality image:", img.src.substring(0, 50));
          try {
            const upscaledDataUrl = await upscaleImage(img, targetSize, targetSize);
            const upscaledImg = new Image();
            await new Promise<void>((resolve) => {
              upscaledImg.onload = () => resolve();
              upscaledImg.onerror = () => resolve(); // Use original if upscale fails
              upscaledImg.src = upscaledDataUrl;
            });
            images.push(upscaledImg.complete && upscaledImg.naturalWidth > 0 ? upscaledImg : img);
          } catch {
            images.push(img); // Use original if upscale fails
          }
        } else {
          images.push(img);
        }
      }
      
      console.log("All images loaded and upscaled successfully");

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

        // Draw text with higher quality
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 36px system-ui, -apple-system, sans-serif"; // Doubled font size
        ctx.textAlign = "center";
        
        // Product name with SKU and quantity
        const name = selectedProducts[index].name;
        const sku = selectedProducts[index].sku;
        const quantity = selectedProducts[index].quantity;
        let displayText = name;
        if (sku) displayText += ` (${sku})`;
        if (quantity) displayText += ` x${quantity}`;
        ctx.fillText(displayText, x + imgSize / 2, y + imgSize + 60);
        
        // Price
        if (selectedProducts[index].price) {
          ctx.font = "32px system-ui, -apple-system, sans-serif"; // Doubled font size
          ctx.fillStyle = "#059669";
          ctx.fillText(
            selectedProducts[index].price!,
            x + imgSize / 2,
            y + imgSize + 110
          );
        }
      });

      // Convert to blob with high quality
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          console.log("Image generated successfully, URL:", url);
          setImageUrl(url);
        } else {
          console.error("Failed to create blob from canvas");
          toast.error("Failed to generate image");
        }
        setIsGenerating(false);
      }, "image/png", 1.0); // Maximum quality
    } catch (error) {
      console.error("Error generating order image:", error);
      toast.error("Failed to generate order image. Please try again.");
      setIsGenerating(false);
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
    onResetSelection();
    onClose();
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Receipt attached!");
    }
  };

  const handleWhatsAppShare = async () => {
    if (!imageUrl) {
      toast.error("Image not ready yet");
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const orderFile = new File([blob], `order-${Date.now()}.png`, { type: "image/png" });

      const files = [orderFile];
      if (receiptFile) {
        files.push(receiptFile);
      }

      // Try Web Share API first (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: receiptFile ? "Order & Receipt" : "Order Image",
          text: `Order: ${selectedProducts.map(p => p.name).join(", ")}`,
        });
        toast.success("Sharing to WhatsApp...");
        onResetSelection();
        onClose();
      } else {
        // Desktop fallback: Download images and open WhatsApp Web
        const link = document.createElement("a");
        link.download = `order-${Date.now()}.png`;
        link.href = imageUrl;
        link.click();
        
        if (receiptFile) {
          setTimeout(() => {
            const receiptLink = document.createElement("a");
            receiptLink.download = receiptFile.name;
            receiptLink.href = URL.createObjectURL(receiptFile);
            receiptLink.click();
          }, 300);
        }
        
        // Small delay to ensure download starts
        setTimeout(() => {
          const text = `Order: ${selectedProducts.map(p => p.name).join(", ")}`;
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
          window.open(whatsappUrl, "_blank");
          toast.success("Images downloaded! Please attach them in WhatsApp");
          onResetSelection();
          onClose();
        }, 700);
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
      const orderFile = new File([blob], `order-${Date.now()}.png`, { type: "image/png" });

      const files = [orderFile];
      if (receiptFile) {
        files.push(receiptFile);
      }

      // Try Web Share API first (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: receiptFile ? "Order & Receipt" : "Order Image",
          text: `Order: ${selectedProducts.map(p => p.name).join(", ")}`,
        });
        toast.success("Sharing to Messenger...");
        onResetSelection();
        onClose();
      } else {
        // Desktop fallback: Download images and open Messenger
        const link = document.createElement("a");
        link.download = `order-${Date.now()}.png`;
        link.href = imageUrl;
        link.click();
        
        if (receiptFile) {
          setTimeout(() => {
            const receiptLink = document.createElement("a");
            receiptLink.download = receiptFile.name;
            receiptLink.href = URL.createObjectURL(receiptFile);
            receiptLink.click();
          }, 300);
        }
        
        // Small delay to ensure download starts
        setTimeout(() => {
          const messengerUrl = `https://www.facebook.com/messages/t/`;
          window.open(messengerUrl, "_blank");
          toast.success("Images downloaded! Please attach them in Messenger");
          onResetSelection();
          onClose();
        }, 700);
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
        <div className="flex-1 flex items-center justify-center overflow-auto gap-4">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating order image...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2">
                <Label className="text-sm text-muted-foreground">Order Image</Label>
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt="Order preview" 
                    className="max-w-full max-h-[400px] rounded-lg shadow-xl"
                  />
                )}
              </div>
              {receiptPreview && (
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Receipt</Label>
                  <img 
                    src={receiptPreview} 
                    alt="Receipt preview" 
                    className="max-w-full max-h-[400px] rounded-lg shadow-xl"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3">
          {/* Receipt Upload */}
          <div className="flex flex-col gap-2 p-4 border border-border rounded-lg bg-card">
            <Label htmlFor="receipt-upload" className="text-sm font-medium">
              Attach Receipt (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt-upload"
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="flex-1"
              />
              {receiptFile && (
                <Button
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPreview("");
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <Button 
            onClick={handleDownload} 
            className="w-full"
            size="lg"
            disabled={isGenerating || !imageUrl}
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
              disabled={isGenerating || !imageUrl}
            >
              <Send className="mr-2 h-5 w-5" />
              WhatsApp
            </Button>
            <Button 
              onClick={handleMessengerShare} 
              className="flex-1"
              size="lg"
              variant="secondary"
              disabled={isGenerating || !imageUrl}
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
