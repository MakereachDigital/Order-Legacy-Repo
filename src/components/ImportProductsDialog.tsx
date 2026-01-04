import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Plus, Loader2, X, FileSpreadsheet, Link, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";

interface ImportProductsDialogProps {
  onImportProducts: (products: Product[]) => void;
  onAddProduct: (product: Product) => void;
}

export const ImportProductsDialog = ({ onImportProducts, onAddProduct }: ImportProductsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual add product state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imagePreview) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newProduct: Product = {
      id: `custom-${Date.now()}`,
      name,
      image: imagePreview,
      price: price || undefined,
      sku: sku || undefined,
    };

    onAddProduct(newProduct);
    toast.success("Product added successfully");
    
    // Reset form
    setName("");
    setPrice("");
    setSku("");
    setImageFile(null);
    setImagePreview("");
    setOpen(false);
  };

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
        console.error("[INTERNAL] URL import error:", error);
        toast.error(`Unable to import product ${i + 1}. Please try again.`);
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

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error("CSV file must have a header row and at least one data row");
          return;
        }

        // Parse header to find column indices
        const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
        const nameIndex = header.findIndex(h => h.includes("name") || h.includes("product"));
        const imageIndex = header.findIndex(h => h.includes("image") || h.includes("photo") || h.includes("url"));
        const priceIndex = header.findIndex(h => h.includes("price"));
        const skuIndex = header.findIndex(h => h.includes("sku") || h.includes("code") || h.includes("id"));
        const categoryIndex = header.findIndex(h => h.includes("category") || h.includes("type"));

        if (nameIndex === -1) {
          toast.error("CSV must have a 'name' or 'product' column");
          return;
        }

        const products: Product[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0) continue;

          const name = values[nameIndex]?.trim();
          if (!name) continue;

          products.push({
            id: `csv-${Date.now()}-${i}`,
            name,
            image: imageIndex !== -1 ? values[imageIndex]?.trim() || "/placeholder.svg" : "/placeholder.svg",
            price: priceIndex !== -1 ? values[priceIndex]?.trim() : undefined,
            sku: skuIndex !== -1 ? values[skuIndex]?.trim() : undefined,
            category: categoryIndex !== -1 ? values[categoryIndex]?.trim() as Product["category"] : undefined,
          });
        }

        if (products.length > 0) {
          setExtractedProducts(products);
          toast.success(`Parsed ${products.length} product(s) from CSV`);
        } else {
          toast.error("No valid products found in CSV");
        }
      } catch (error) {
        console.error("[INTERNAL] CSV parsing error:", error);
        toast.error("Unable to parse CSV file. Please check the format and try again.");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
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

  const downloadCSVTemplate = () => {
    const template = `name,sku,price,image,category
"Product Name 1","SKU001","1499.00৳","https://example.com/image1.jpg","grocery"
"Product Name 2","SKU002","2500.00৳","https://example.com/image2.jpg","dairy"`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV template downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Products</DialogTitle>
        </DialogHeader>

        {extractedProducts.length === 0 ? (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="urls" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                From URLs
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                From CSV
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4 mt-4">
              <form onSubmit={handleManualSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g., 1,499.00৳"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="e.g., OPC"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="image">Product Image *</Label>
                    <div className="flex flex-col gap-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                      {imagePreview && (
                        <div className="relative w-full h-32 rounded-md overflow-hidden border">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {!imagePreview && (
                        <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-8 w-8" />
                            <p className="text-sm">Upload image</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button type="submit">Add Product</Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="urls" className="space-y-4 mt-4">
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
                  "Start Import"
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="csv" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Upload CSV file</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadCSVTemplate}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Template
                  </Button>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file with product data
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Select File
                  </Button>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Expected CSV columns:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>name</strong> or <strong>product</strong> (required)</li>
                    <li>• <strong>image</strong>, <strong>photo</strong>, or <strong>url</strong></li>
                    <li>• <strong>price</strong>, <strong>sku</strong>, <strong>category</strong></li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
