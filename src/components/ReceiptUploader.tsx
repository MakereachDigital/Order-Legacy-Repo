import { useState, useEffect } from "react";
import { Upload, Loader2, Trash2, Image as ImageIcon } from "lucide-react";
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

interface ReceiptUploaderProps {
  onProductsExtracted: (products: ExtractedProduct[]) => void;
  receiptFile: File | null;
  setReceiptFile: (file: File | null) => void;
  receiptPreview: string;
  setReceiptPreview: (preview: string) => void;
}

export const ReceiptUploader = ({ 
  onProductsExtracted, 
  receiptFile, 
  setReceiptFile, 
  receiptPreview, 
  setReceiptPreview 
}: ReceiptUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-extract when receipt is uploaded
  useEffect(() => {
    if (receiptPreview && !isProcessing) {
      handleExtractProducts();
    }
  }, [receiptPreview]);

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
    }
  };

  const handleExtractProducts = async () => {
    if (!receiptPreview || isProcessing) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-receipt', {
        body: { imageBase64: receiptPreview }
      });

      if (error) throw error;

      const products = data.products || [];

      if (products.length === 0) {
        toast.error("No products found in receipt");
      } else {
        toast.success(`Found ${products.length} product(s)!`);
        onProductsExtracted(products);
      }
    } catch (error) {
      console.error("[INTERNAL] Receipt extraction error:", error);
      toast.error("Unable to extract products from receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setReceiptFile(null);
    setReceiptPreview("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">Receipt Image</Label>
        {receiptFile && (
          <Button 
            onClick={handleReset} 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
      
      {!receiptPreview ? (
        <label className={cn(
          "flex flex-col items-center justify-center h-72 rounded-xl cursor-pointer",
          "border-2 border-dashed border-border/80",
          "bg-muted/30 hover:bg-muted/50 hover:border-primary/50",
          "transition-all duration-300 group"
        )}>
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
              <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-foreground">Click to upload receipt</span>
              <span className="block text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
            </div>
          </div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleReceiptUpload}
            className="hidden"
            disabled={isProcessing}
          />
        </label>
      ) : (
        <div className="relative h-72 rounded-xl overflow-hidden bg-muted/20 border border-border/60">
          <img
            src={receiptPreview}
            alt="Receipt preview"
            className="w-full h-full object-contain"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
              <div className="p-4 rounded-full bg-primary/10 mb-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Extracting products...</span>
              <span className="text-xs text-muted-foreground mt-1">This may take a moment</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};