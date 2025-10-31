import { useState } from "react";
import { products } from "@/data/products";
import { ProductGrid } from "@/components/ProductGrid";
import { OrderImageGenerator } from "@/components/OrderImageGenerator";
import { Button } from "@/components/ui/button";
import { ImageIcon, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGenerator, setShowGenerator] = useState(false);

  const handleToggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleGenerateImage = () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one product");
      return;
    }
    setShowGenerator(true);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    toast.success("Selection cleared");
  };

  const selectedProducts = products.filter((p) => selectedIds.has(p.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <ShoppingBasket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Delivery Picker</h1>
                <p className="text-sm text-muted-foreground">Select order items</p>
              </div>
            </div>
            {selectedIds.size > 0 && (
              <Button
                onClick={handleClearSelection}
                variant="ghost"
                size="sm"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Product Grid */}
      <main className="pb-24">
        <ProductGrid
          products={products}
          selectedIds={selectedIds}
          onToggleProduct={handleToggleProduct}
        />
      </main>

      {/* Bottom Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <Button
              onClick={handleGenerateImage}
              className="w-full"
              size="lg"
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              Generate Order Image ({selectedIds.size} items)
            </Button>
          </div>
        </div>
      )}

      {/* Order Image Generator Modal */}
      {showGenerator && (
        <OrderImageGenerator
          selectedProducts={selectedProducts}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
};

export default Index;
