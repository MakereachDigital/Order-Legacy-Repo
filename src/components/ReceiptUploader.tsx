import { useState, useEffect } from "react";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
        <Label className="text-sm font-medium">Receipt Image</Label>
        {receiptFile && (
          <Button onClick={handleReset} variant="ghost" size="sm" className="h-7 text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      {!receiptPreview ? (
        <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to upload receipt</span>
          <span className="text-xs text-muted-foreground/70 mt-1">Max 10MB</span>
          <Input
            type="file"
            accept="image/*"
            onChange={handleReceiptUpload}
            className="hidden"
            disabled={isProcessing}
          />
        </label>
      ) : (
        <div className="relative h-64 border border-border rounded-lg overflow-hidden bg-muted/30">
          <img
            src={receiptPreview}
            alt="Receipt preview"
            className="w-full h-full object-contain"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Extracting products...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
