import { useState } from "react";
import { Upload, X, Check, AlertCircle, Trash2 } from "lucide-react";
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
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProduct[]>([]);
  const [showResults, setShowResults] = useState(false);

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
      setShowResults(false);
      setExtractedProducts([]);
    }
  };

  const handleExtractProducts = async () => {
    if (!receiptPreview) {
      toast.error("Please upload a receipt first");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-receipt', {
        body: { imageBase64: receiptPreview }
      });

      if (error) throw error;

      const products = data.products || [];
      setExtractedProducts(products);
      setShowResults(true);

      if (products.length === 0) {
        toast.error("No products found in receipt");
      } else {
        toast.success(`Found ${products.length} product(s)!`);
      }
    } catch (error) {
      console.error("[INTERNAL] Receipt extraction error:", error);
      toast.error("Unable to extract products from receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoSelect = () => {
    if (extractedProducts.length === 0) {
      toast.error("No products to select");
      return;
    }
    onProductsExtracted(extractedProducts);
    toast.success("Products auto-selected!");
  };

  const handleReset = () => {
    setReceiptFile(null);
    setReceiptPreview("");
    setExtractedProducts([]);
    setShowResults(false);
  };

  const handleRemoveProduct = (index: number) => {
    setExtractedProducts((prev) => prev.filter((_, i) => i !== index));
    if (extractedProducts.length <= 1) {
      toast.info("All products removed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-Select Button - Always on top when results are shown */}
      {showResults && extractedProducts.length > 0 && (
        <Button 
          onClick={handleAutoSelect} 
          className="w-full" 
          size="lg"
        >
          <Check className="h-4 w-4 mr-2" />
          Auto-Select These Products ({extractedProducts.length})
        </Button>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Receipt Preview - Fixed Size */}
        <div className="space-y-3">
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
            </div>
          )}

          {/* Extract Button */}
          {receiptPreview && !showResults && (
            <Button
              onClick={handleExtractProducts}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Extract Products"}
            </Button>
          )}
        </div>

        {/* Right: Extracted Products */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Extracted Products</Label>
          
          {!showResults ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg bg-muted/20">
              <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <span className="text-sm text-muted-foreground">Upload a receipt and click Extract</span>
            </div>
          ) : extractedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg bg-muted/20">
              <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
              <span className="text-sm text-muted-foreground">No products found in receipt</span>
              <span className="text-xs text-muted-foreground/70 mt-1">Try a clearer image</span>
            </div>
          ) : (
            <div className="h-64 overflow-y-auto border border-border rounded-lg p-2 space-y-2">
              {extractedProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold px-2 py-1 bg-primary/10 text-primary rounded">
                      x{product.quantity}
                    </span>
                    <Button
                      onClick={() => handleRemoveProduct(index)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status Badge */}
          {showResults && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              {extractedProducts.length > 0 ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    Found {extractedProducts.length} product(s)
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">No products found</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
