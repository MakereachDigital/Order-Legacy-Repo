import { useState } from "react";
import { Upload, X, Check, AlertCircle } from "lucide-react";
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
      console.error("Error extracting products:", error);
      toast.error("Failed to extract products from receipt");
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
    <div className="border border-border rounded-lg p-4 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Smart Receipt Upload</Label>
        {receiptFile && (
          <Button onClick={handleReset} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleReceiptUpload}
            className="flex-1"
            disabled={isProcessing}
          />
          {receiptFile && !showResults && (
            <Button
              onClick={handleExtractProducts}
              disabled={isProcessing}
              variant="default"
            >
              <Upload className="h-4 w-4 mr-1" />
              {isProcessing ? "Processing..." : "Extract"}
            </Button>
          )}
        </div>

        {receiptPreview && !showResults && (
          <div className="relative w-full max-w-xs mx-auto max-h-60 overflow-hidden">
            <img
              src={receiptPreview}
              alt="Receipt preview"
              className="w-full h-auto rounded-lg border border-border object-contain"
            />
          </div>
        )}

        {showResults && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {receiptPreview && (
              <div className="relative w-full max-w-xs mx-auto max-h-48 overflow-hidden">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full h-auto rounded-lg border border-border object-contain"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg sticky top-0 z-10">
              <div className="flex items-center gap-2">
                {extractedProducts.length > 0 ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium">
                      Found {extractedProducts.length} product(s)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">No products found</span>
                  </>
                )}
              </div>
            </div>

            {extractedProducts.length > 0 && (
              <>
                <div className="space-y-2">
                  {extractedProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border"
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
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleAutoSelect} 
                  className="w-full sticky bottom-0 z-10" 
                  size="lg"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Auto-Select These Products
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
