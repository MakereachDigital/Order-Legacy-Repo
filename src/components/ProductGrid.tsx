import { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { ViewMode } from "./ViewToggle";

interface ProductGridProps {
  products: Product[];
  selectedIds: Set<string>;
  onToggleProduct: (id: string) => void;
  viewMode: ViewMode;
}

export const ProductGrid = ({ products, selectedIds, onToggleProduct, viewMode }: ProductGridProps) => {
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
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4";
      default:
        return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4";
    }
  };

  return (
    <div className={getGridClasses()}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={selectedIds.has(product.id)}
          onToggle={() => onToggleProduct(product.id)}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
};
