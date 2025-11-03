import { useState, useEffect } from "react";
import { Pencil, Upload } from "lucide-react";
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
import { toast } from "sonner";
import { Product } from "@/types/product";

interface EditProductDialogProps {
  product: Product;
  onEditProduct: (updatedProduct: Product) => void;
}

export const EditProductDialog = ({ product, onEditProduct }: EditProductDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price || "");
  const [sku, setSku] = useState(product.sku || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product.image);

  useEffect(() => {
    if (open) {
      setName(product.name);
      setPrice(product.price || "");
      setSku(product.sku || "");
      setImagePreview(product.image);
      setImageFile(null);
    }
  }, [open, product]);

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
      toast.error("Please fill in required fields");
      return;
    }

    const updatedProduct: Product = {
      ...product,
      name,
      price: price || undefined,
      sku: sku || undefined,
      image: imagePreview,
    };

    onEditProduct(updatedProduct);
    toast.success("Product updated successfully");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 z-10 bg-background/80 hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details including name, price, SKU, and image.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 1,499.00৳"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g., LD-1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image">Product Image *</Label>
              <div className="flex flex-col gap-2">
                <Input
                  id="edit-image"
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
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
