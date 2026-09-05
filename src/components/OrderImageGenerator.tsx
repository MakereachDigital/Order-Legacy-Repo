import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { Download, X, MessageCircle, Send, Loader2, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { upscaleImage, needsUpscaling } from "@/lib/imageUpscaler";
import type { ReceiptItem } from "./ReceiptUploader";

export interface OrderGroup {
  id: string;
  products: Product[];
  receipt?: ReceiptItem;
}

interface OrderImageGeneratorProps {
  orders: OrderGroup[];
  onClose: () => void;
  onResetSelection: () => void;
}

interface RenderedOrder {
  id: string;
  imageUrl: string;
  products: Product[];
  receipt?: ReceiptItem;
}

// Load image with proxy fallback for external URLs
const loadImage = (src: string): Promise<HTMLImageElement> => {
  const isLocalOrDataUrl =
    src.startsWith("data:") ||
    src.startsWith("/") ||
    src.startsWith("blob:") ||
    !src.startsWith("http");

  if (isLocalOrDataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("image-proxy", {
          body: { imageUrl: src },
        });
        if (error) throw error;

        const dataUrl = (data as { dataUrl?: string })?.dataUrl;
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

const renderOrderCanvas = async (products: Product[]): Promise<string> => {
  const itemsPerRow = Math.min(2, products.length);
  const rows = Math.ceil(products.length / itemsPerRow);
  const imgSize = 600;
  const padding = 40;
  const textHeight = 160;

  const canvas = document.createElement("canvas");
  canvas.width = itemsPerRow * imgSize + (itemsPerRow + 1) * padding;
  canvas.height = rows * (imgSize + textHeight) + (rows + 1) * padding;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const loadedImages = await Promise.all(products.map((p) => loadImage(p.image)));

  const images: HTMLImageElement[] = [];
  for (const img of loadedImages) {
    if (needsUpscaling(img, imgSize, imgSize)) {
      try {
        const upscaledDataUrl = await upscaleImage(img, imgSize, imgSize);
        const upscaled = new Image();
        await new Promise<void>((resolve) => {
          upscaled.onload = () => resolve();
          upscaled.onerror = () => resolve();
          upscaled.src = upscaledDataUrl;
        });
        images.push(upscaled.complete && upscaled.naturalWidth > 0 ? upscaled : img);
      } catch {
        images.push(img);
      }
    } else {
      images.push(img);
    }
  }

  images.forEach((img, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const x = col * imgSize + (col + 1) * padding;
    const y = row * (imgSize + textHeight) + (row + 1) * padding;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, imgSize, imgSize, 16);
    ctx.clip();
    ctx.drawImage(img, x, y, imgSize, imgSize);
    ctx.restore();

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, imgSize, imgSize, 16);
    ctx.stroke();

    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";

    const p = products[index];
    let displayText = p.name;
    if (p.sku) displayText += ` (${p.sku})`;
    if (p.quantity) displayText += ` x${p.quantity}`;
    ctx.fillText(displayText, x + imgSize / 2, y + imgSize + 60);

    if (p.price) {
      ctx.font = "32px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#059669";
      ctx.fillText(p.price, x + imgSize / 2, y + imgSize + 110);
    }
  });

  return await new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to create blob"));
        resolve(URL.createObjectURL(blob));
      },
      "image/png",
      1.0
    );
  });
};

export const OrderImageGenerator = ({
  orders,
  onClose,
  onResetSelection,
}: OrderImageGeneratorProps) => {
  const [rendered, setRendered] = useState<RenderedOrder[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      if (orders.length === 0) return;
      setIsGenerating(true);
      try {
        const results = await Promise.all(
          orders.map(async (o) => ({
            id: o.id,
            imageUrl: await renderOrderCanvas(o.products),
            products: o.products,
            receipt: o.receipt,
          }))
        );
        if (!cancelled) setRendered(results);
      } catch (error) {
        console.error("Error generating order images:", error);
        toast.error("Failed to generate order image(s). Please try again.");
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };

    void generate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const orderFilesFromRendered = async (): Promise<File[]> => {
    const files: File[] = [];
    for (let i = 0; i < rendered.length; i++) {
      const r = rendered[i];
      const response = await fetch(r.imageUrl);
      const blob = await response.blob();
      files.push(new File([blob], `order-${i + 1}-${Date.now()}.png`, { type: "image/png" }));
      if (r.receipt) files.push(r.receipt.file);
    }
    return files;
  };

  const downloadOne = async (r: RenderedOrder, index: number) => {
    const link = document.createElement("a");
    link.download = `order-${index + 1}-${Date.now()}.png`;
    link.href = r.imageUrl;
    link.click();
    toast.success(`Downloading order ${index + 1}`);
  };

  const shareOne = async (r: RenderedOrder, index: number, target: "whatsapp" | "messenger") => {
    try {
      const response = await fetch(r.imageUrl);
      const blob = await response.blob();
      const files: File[] = [
        new File([blob], `order-${index + 1}-${Date.now()}.png`, { type: "image/png" }),
      ];
      if (r.receipt) files.push(r.receipt.file);

      const names = r.products.map((p) => p.name).join(", ");

      if (navigator.share && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: `Order ${index + 1}`,
          text: `Order ${index + 1}: ${names}`,
        });
        toast.success(`Sharing order ${index + 1} to ${target === "whatsapp" ? "WhatsApp" : "Messenger"}...`);
      } else {
        files.forEach((f, i) => {
          setTimeout(() => {
            const link = document.createElement("a");
            link.download = f.name;
            link.href = URL.createObjectURL(f);
            link.click();
          }, i * 300);
        });
        setTimeout(() => {
          if (target === "whatsapp") {
            window.open(`https://wa.me/?text=${encodeURIComponent(`Order ${index + 1}: ${names}`)}`, "_blank");
          } else {
            window.open("https://www.facebook.com/messages/t/", "_blank");
          }
          toast.success("Files downloaded! Please attach them manually.");
        }, files.length * 300 + 400);
      }
    } catch (error) {
      console.error(`Error sharing order ${index + 1}:`, error);
      toast.error("Failed to share. Please try the download button.");
    }
  };

  const handleDownload = async () => {
    if (rendered.length === 0) {
      toast.error("Images not ready yet");
      return;
    }
    rendered.forEach((r, i) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.download = `order-${i + 1}-${Date.now()}.png`;
        link.href = r.imageUrl;
        link.click();
      }, i * 250);
    });
    toast.success(`Downloading ${rendered.length} order image(s)!`);
    setTimeout(() => {
      onResetSelection();
      onClose();
    }, rendered.length * 250 + 200);
  };

  const shareVia = async (target: "whatsapp" | "messenger") => {
    if (rendered.length === 0) {
      toast.error("Images not ready yet");
      return;
    }

    try {
      const files = await orderFilesFromRendered();
      const allProductNames = rendered.flatMap((r) => r.products.map((p) => p.name)).join(", ");

      if (navigator.share && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: rendered.length > 1 ? `${rendered.length} Orders` : "Order Image",
          text: `Order: ${allProductNames}`,
        });
        toast.success(`Sharing to ${target === "whatsapp" ? "WhatsApp" : "Messenger"}...`);
        onResetSelection();
        onClose();
      } else {
        // Desktop fallback: download everything then open target
        files.forEach((f, i) => {
          setTimeout(() => {
            const link = document.createElement("a");
            link.download = f.name;
            link.href = URL.createObjectURL(f);
            link.click();
          }, i * 300);
        });

        setTimeout(() => {
          if (target === "whatsapp") {
            const text = `Order: ${allProductNames}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
          } else {
            window.open("https://www.facebook.com/messages/t/", "_blank");
          }
          toast.success("Files downloaded! Please attach them manually.");
          onResetSelection();
          onClose();
        }, files.length * 300 + 400);
      }
    } catch (error) {
      console.error(`Error sharing to ${target}:`, error);
      toast.error("Failed to share. Please try the download button.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="container mx-auto min-h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            {rendered.length > 1 ? `${rendered.length} Order Images` : "Order Image"}
          </h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Previews */}
        <div className="flex-1 flex flex-col items-center gap-6 py-2">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating order image(s)...</p>
            </div>
          ) : (
            rendered.map((r, i) => (
              <div
                key={r.id}
                className="w-full max-w-2xl p-4 rounded-2xl border border-border/60 bg-card/40 flex flex-col items-center gap-3"
              >
                <div className="flex items-center justify-between w-full">
                  <Label className="text-sm font-semibold text-foreground">
                    Order {i + 1} · {r.products.length} item(s)
                  </Label>
                  {r.receipt && (
                    <span className="text-[11px] text-muted-foreground">
                      Receipt attached
                    </span>
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-start justify-center gap-4 w-full">
                  <div className="flex-1 min-w-0 flex justify-center">
                    <img
                      src={r.imageUrl}
                      alt={`Order ${i + 1} preview`}
                      className="max-w-full max-h-[360px] rounded-lg shadow-xl object-contain"
                    />
                  </div>
                  {r.receipt && (
                    <div className="flex flex-col items-center gap-1 shrink-0 w-[160px] md:w-[180px]">
                      <Label className="text-[11px] text-muted-foreground">Receipt</Label>
                      <img
                        src={r.receipt.preview}
                        alt="Receipt"
                        className="w-full h-auto max-h-[260px] object-contain rounded-lg shadow-md border border-border/40"
                      />
                    </div>
                  )}
                </div>

                {/* Per-order actions */}
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => downloadOne(r, i)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => shareOne(r, i, "whatsapp")}
                  >
                    <Send className="mr-1.5 h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => shareOne(r, i, "messenger")}
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Messenger
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3 max-w-2xl w-full mx-auto">
          <Button
            onClick={handleDownload}
            className="w-full"
            size="lg"
            disabled={isGenerating || rendered.length === 0}
          >
            <Download className="mr-2 h-5 w-5" />
            Download {rendered.length > 1 ? `All (${rendered.length})` : ""}
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={() => shareVia("whatsapp")}
              className="flex-1"
              size="lg"
              variant="secondary"
              disabled={isGenerating || rendered.length === 0}
            >
              <Send className="mr-2 h-5 w-5" />
              WhatsApp
            </Button>
            <Button
              onClick={() => shareVia("messenger")}
              className="flex-1"
              size="lg"
              variant="secondary"
              disabled={isGenerating || rendered.length === 0}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Messenger
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
