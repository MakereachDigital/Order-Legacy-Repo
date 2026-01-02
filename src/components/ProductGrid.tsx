import { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { ViewMode } from "./ViewToggle";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  selectedProducts: Product[];
  onToggleProduct: (product: Product) => void;
  onEditProduct: (updatedProduct: Product) => void;
  getSelectionNumbers: (productId: string) => number[];
  viewMode: ViewMode;
  isEditMode?: boolean;
  selectedForEdit?: string[];
  isAuthenticated: boolean;
}

export const ProductGrid = ({ 
  products, 
  selectedProducts, 
  onToggleProduct,
  onEditProduct, 
  getSelectionNumbers,
  viewMode,
  isEditMode = false,
  selectedForEdit = [],
  isAuthenticated
}: ProductGridProps) => {
  const getGridClasses = () => {
    if (viewMode === "list") {
      return "flex flex-col gap-3 p-4";
    }
    
    switch (viewMode) {
      case "small":
        return "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4";
      case "medium":
        return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4";
      case "large":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-4";
      default:
        return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4";
    }
  };

  return (
    <div className={cn(getGridClasses(), "container mx-auto")}>
      {products.map((product, index) => {
        const selectionNumbers = getSelectionNumbers(product.id);
        const isSelectedForEdit = selectedForEdit.includes(product.id);
        return (
          <div 
            key={product.id} 
            className="animate-fade-in"
            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
          >
            <ProductCard
              product={product}
              selectionNumbers={selectionNumbers}
              onToggle={() => onToggleProduct(product)}
              onEdit={onEditProduct}
              viewMode={viewMode}
              isEditMode={isEditMode}
              isSelectedForEdit={isSelectedForEdit}
              isAuthenticated={isAuthenticated}
            />
          </div>
        );
      })}
    </div>
  );
};