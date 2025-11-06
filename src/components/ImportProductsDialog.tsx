import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Download, Loader2, X, Edit } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";

interface ImportProductsDialogProps {
  onImportProducts: (products: Product[]) => void;
}

export const ImportProductsDialog = ({ onImportProducts }: ImportProductsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleImport = async () => {
    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urlList.length === 0) {
      toast.error("Please enter at least one URL");
      return;
    }

    setIsImporting(true);
    setExtractedProducts([]);
    setCurrentIndex(0);

    const products: Product[] = [];

    for (let i = 0; i < urlList.length; i++) {
      setCurrentIndex(i + 1);
      try {
        const { data, error } = await supabase.functions.invoke("scrape-product", {
          body: { url: urlList[i] },
        });

        if (error) throw error;

        if (data.product) {
          products.push({
            id: `imported-${Date.now()}-${i}`,
            ...data.product,
          });
        }
      } catch (error) {
        console.error(`Failed to scrape ${urlList[i]}:`, error);
        toast.error(`Failed to import product ${i + 1}`);
      }
    }

    setExtractedProducts(products);
    setIsImporting(false);

    if (products.length > 0) {
      toast.success(`Successfully extracted ${products.length} product(s)!`);
    } else {
      toast.error("No products could be extracted");
    }
  };

  const handleConfirmImport = () => {
    if (extractedProducts.length === 0) return;
    onImportProducts(extractedProducts);
    toast.success(`Added ${extractedProducts.length} product(s) to catalog!`);
    setOpen(false);
    setUrls("");
    setExtractedProducts([]);
  };

  const handleEditProduct = (index: number, field: keyof Product, value: string) => {
    setExtractedProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
  };

  const handleRemoveProduct = (index: number) => {
    setExtractedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Download className="h-4 w-4 mr-1" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products from URLs</DialogTitle>
        </DialogHeader>

        {extractedProducts.length === 0 ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="urls">Product URLs (one per line)</Label>
              <textarea
                id="urls"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://legacydhaka.com/product/example-1/&#10;https://legacydhaka.com/product/example-2/"
                className="w-full h-48 mt-2 p-3 border border-input rounded-md bg-background text-foreground resize-none font-mono text-sm"
                disabled={isImporting}
              />
            </div>

            {isImporting && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Importing product {currentIndex} of {urls.split("\n").filter(u => u.trim()).length}...
                </span>
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={isImporting || urls.trim().length === 0}
              className="w-full"
              size="lg"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Start Import
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Successfully extracted {extractedProducts.length} product(s)!
              </p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {extractedProducts.map((product, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-3 space-y-2 bg-card"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded border border-border"
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        value={product.name}
                        onChange={(e) => handleEditProduct(index, "name", e.target.value)}
                        className="font-medium"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={product.sku || ""}
                          onChange={(e) => handleEditProduct(index, "sku", e.target.value)}
                          placeholder="SKU"
                          className="flex-1 text-sm"
                        />
                        <Input
                          value={product.price || ""}
                          onChange={(e) => handleEditProduct(index, "price", e.target.value)}
                          placeholder="Price"
                          className="flex-1 text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRemoveProduct(index)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setExtractedProducts([]);
                  setUrls("");
                }}
                variant="outline"
                className="flex-1"
              >
                Start Over
              </Button>
              <Button
                onClick={handleConfirmImport}
                className="flex-1"
                size="lg"
              >
                Add All Products
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
