import { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  selectedIds: Set<string>;
  onToggleProduct: (id: string) => void;
}

export const ProductGrid = ({ products, selectedIds, onToggleProduct }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={selectedIds.has(product.id)}
          onToggle={() => onToggleProduct(product.id)}
        />
      ))}
    </div>
  );
};
