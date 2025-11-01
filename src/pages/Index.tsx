import { useState, useMemo } from "react";
import { legacyProducts } from "@/data/legacyProducts";
import { ProductGrid } from "@/components/ProductGrid";
import { OrderImageGenerator } from "@/components/OrderImageGenerator";
import { SearchBar } from "@/components/SearchBar";
import { AddProductDialog } from "@/components/AddProductDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { Button } from "@/components/ui/button";
import { ImageIcon, Package } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";

const Index = () => {
  const [products, setProducts] = useState<Product[]>(legacyProducts);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("medium");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleToggleProduct = (product: Product) => {
    setSelectedProducts((prev) => [...prev, product]);
  };

  const handleRemoveSelection = (index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateImage = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    setShowGenerator(true);
  };

  const handleClearSelection = () => {
    setSelectedProducts([]);
    toast.success("Selection cleared");
  };

  const getSelectionNumbers = (productId: string): number[] => {
    return selectedProducts
      .map((p, index) => (p.id === productId ? index + 1 : -1))
      .filter((num) => num !== -1);
  };

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

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
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              <AddProductDialog onAddProduct={handleAddProduct} />
              {selectedProducts.length > 0 && (
                <Button
                  onClick={handleClearSelection}
                  variant="ghost"
                  size="sm"
                >
                  Clear ({selectedProducts.length})
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
            selectedProducts={selectedProducts}
            onToggleProduct={handleToggleProduct}
            getSelectionNumbers={getSelectionNumbers}
            viewMode={viewMode}
          />
        )}
      </main>

      {/* Bottom Action Bar with Thumbnails */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-3 space-y-3">
            {/* Thumbnail Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {selectedProducts.map((product, index) => (
                <div
                  key={index}
                  onClick={() => handleRemoveSelection(index)}
                  className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-primary cursor-pointer hover:opacity-75 transition-opacity"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-bl-lg flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Generate Button */}
            <Button
              onClick={handleGenerateImage}
              className="w-full"
              size="lg"
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              Generate Order Image ({selectedProducts.length} items)
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
