import { useState, useMemo } from "react";
import { legacyProducts } from "@/data/legacyProducts";
import { ProductGrid } from "@/components/ProductGrid";
import { OrderImageGenerator } from "@/components/OrderImageGenerator";
import { SearchBar } from "@/components/SearchBar";
import { AddProductDialog } from "@/components/AddProductDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ImageIcon, Package } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";

const Index = () => {
  const [products, setProducts] = useState<Product[]>(legacyProducts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGenerator, setShowGenerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

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

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const selectedProducts = products.filter((p) => selectedIds.has(p.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Legacy Dhaka</h1>
                <p className="text-xs text-muted-foreground">Delivery Order Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Search & Actions Bar */}
      <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <AddProductDialog onAddProduct={handleAddProduct} />
              {selectedIds.size > 0 && (
                <Button
                  onClick={handleClearSelection}
                  variant="ghost"
                  size="sm"
                >
                  Clear ({selectedIds.size})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="pb-24">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or add a custom product</p>
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            selectedIds={selectedIds}
            onToggleProduct={handleToggleProduct}
          />
        )}
      </main>

      {/* Bottom Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-3">
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
