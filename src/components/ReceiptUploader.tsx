import { useState, useEffect, useRef } from "react";
import { Loader2, Trash2, Image as ImageIcon, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ExtractedProduct {
  sku: string;
  name: string;
  quantity: number;
}

export interface ReceiptItem {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "processing" | "done" | "error";
  productsCount?: number;
}

interface ReceiptUploaderProps {
  onProductsExtracted: (products: ExtractedProduct[]) => void;
  receipts: ReceiptItem[];
  setReceipts: React.Dispatch<React.SetStateAction<ReceiptItem[]>>;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export const ReceiptUploader = ({
  onProductsExtracted,
  receipts,
  setReceipts,
}: ReceiptUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Auto-extract whenever new pending receipts appear
  useEffect(() => {
    const pending = receipts.filter(
      (r) => r.status === "pending" && !processedIdsRef.current.has(r.id)
    );
    if (pending.length === 0) return;

    pending.forEach((r) => processedIdsRef.current.add(r.id));
    void extractBatch(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipts]);

  const extractBatch = async (batch: ReceiptItem[]) => {
    setIsProcessing(true);
    setReceipts((prev) =>
      prev.map((r) =>
        batch.find((b) => b.id === r.id) ? { ...r, status: "processing" } : r
      )
    );

    const allProducts: ExtractedProduct[] = [];

    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          const { data, error } = await supabase.functions.invoke("extract-receipt", {
            body: { imageBase64: item.preview },
          });
          if (error) throw error;
          const products: ExtractedProduct[] = data?.products || [];
          return { id: item.id, products, ok: true as const };
        } catch (err) {
          console.error("[INTERNAL] Receipt extraction error:", err);
          return { id: item.id, products: [] as ExtractedProduct[], ok: false as const };
        }
      })
    );

    setReceipts((prev) =>
      prev.map((r) => {
        const res = results.find((x) => x.id === r.id);
        if (!res) return r;
        return {
          ...r,
          status: res.ok ? "done" : "error",
          productsCount: res.products.length,
        };
      })
    );

    results.forEach((res) => {
      if (res.ok) allProducts.push(...res.products);
    });

    setIsProcessing(false);

    if (allProducts.length === 0) {
      const anyOk = results.some((r) => r.ok);
      toast.error(anyOk ? "No products found in receipts" : "Failed to extract receipts");
    } else {
      toast.success(`Found ${allProducts.length} product(s) across ${batch.length} receipt(s)!`);
      onProductsExtracted(allProducts);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const validFiles = files.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: File size must be less than 10MB`);
        return false;
      }
      return true;
    });

    const newItems: ReceiptItem[] = await Promise.all(
      validFiles.map(async (file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: await readFileAsDataUrl(file),
        status: "pending" as const,
      }))
    );

    setReceipts((prev) => [...prev, ...newItems]);
  };

  const handleRemove = (id: string) => {
    processedIdsRef.current.delete(id);
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    processedIdsRef.current.clear();
    setReceipts([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">
          Receipt Images {receipts.length > 0 && `(${receipts.length})`}
        </Label>
        {receipts.length > 0 && (
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </Button>
        )}
      </div>

      {receipts.length === 0 ? (
        <label
          className={cn(
            "flex flex-col items-center justify-center h-72 rounded-xl cursor-pointer",
            "border-2 border-dashed border-border/80",
            "bg-muted/30 hover:bg-muted/50 hover:border-primary/50",
            "transition-all duration-300 group"
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
              <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-foreground">
                Click to upload receipts
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                Select one or many · PNG, JPG up to 10MB each
              </span>
            </div>
          </div>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleReceiptUpload}
            className="hidden"
            disabled={isProcessing}
          />
        </label>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {receipts.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-muted/20 border border-border/60 group"
              >
                <img
                  src={item.preview}
                  alt="Receipt"
                  className="w-full h-full object-cover"
                />

                {item.status === "processing" && (
                  <div className="absolute inset-0 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-[10px] text-muted-foreground mt-1.5">
                      Extracting…
                    </span>
                  </div>
                )}

                {item.status === "done" && (
                  <div className="absolute top-1.5 left-1.5 bg-primary/90 text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-glow">
                    <CheckCircle2 className="h-3 w-3" />
                    {item.productsCount ?? 0}
                  </div>
                )}

                {item.status === "error" && (
                  <div className="absolute top-1.5 left-1.5 bg-destructive/90 text-destructive-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Failed
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  aria-label="Remove receipt"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <label
              className={cn(
                "flex flex-col items-center justify-center aspect-square rounded-xl cursor-pointer",
                "border-2 border-dashed border-border/80",
                "bg-muted/20 hover:bg-muted/40 hover:border-primary/50",
                "transition-all duration-300 group"
              )}
            >
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[11px] text-muted-foreground mt-1">Add more</span>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleReceiptUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
};
