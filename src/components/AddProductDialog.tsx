import { useState } from "react";
import { Plus, Upload, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Product } from "@/types/product";

interface AddProductDialogProps {
  onAddProduct: (product: Product) => void;
}

export const AddProductDialog = ({ onAddProduct }: AddProductDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [csvContent, setCsvContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
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

  const handleCSVImport = async () => {
    if (!csvContent.trim()) {
      toast.error("Please paste CSV content");
      return;
    }

    setIsProcessing(true);
    try {
      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        toast.error("CSV must have a header and at least one data row");
        return;
      }

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      const nameIdx = headers.indexOf("name");
      const skuIdx = headers.indexOf("sku");
      const priceIdx = headers.indexOf("price");
      const imageIdx = headers.indexOf("image");
      const categoryIdx = headers.indexOf("category");

      if (nameIdx === -1 || imageIdx === -1) {
        toast.error("CSV must have 'name' and 'image' columns");
        return;
      }

      let addedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < Math.max(nameIdx, imageIdx) + 1) continue;

        const product: Product = {
          id: `csv-${Date.now()}-${i}`,
          name: values[nameIdx] || "",
          image: values[imageIdx] || "",
          sku: skuIdx !== -1 ? values[skuIdx] : undefined,
          price: priceIdx !== -1 ? values[priceIdx] : undefined,
          category: categoryIdx !== -1 ? values[categoryIdx] as Product["category"] : undefined,
        };

        if (product.name && product.image) {
          onAddProduct(product);
          addedCount++;
        }
      }

      toast.success(`${addedCount} products imported from CSV`);
      setCsvContent("");
      setOpen(false);
    } catch (error) {
      console.error("CSV import error:", error);
      toast.error("Failed to parse CSV");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Products</DialogTitle>
          <DialogDescription>
            Add products manually or import from CSV.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="csv">CSV Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
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
              <DialogFooter>
                <Button type="submit">Add Product</Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="csv">
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between">
                <Label>CSV Import</Label>
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
              
              <div className="grid gap-2">
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="csv-content">Or Paste CSV Content</Label>
                <Textarea
                  id="csv-content"
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder={`name,sku,price,image,category\n"Product 1","SKU001","1499.00৳","https://...","grocery"`}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Required columns: name, image. Optional: sku, price, category
              </p>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={handleCSVImport}
                disabled={isProcessing || !csvContent.trim()}
              >
                {isProcessing ? "Importing..." : "Import Products"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
