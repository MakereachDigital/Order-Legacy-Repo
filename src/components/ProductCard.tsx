import { Product } from "@/types/product";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
}

export const ProductCard = ({ product, isSelected, onToggle }: ProductCardProps) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative bg-card rounded-xl overflow-hidden shadow-sm transition-all duration-200 active:scale-95",
        "border-2",
        isSelected 
          ? "border-primary shadow-lg ring-2 ring-primary/20" 
          : "border-transparent hover:border-muted"
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
          <Check className="h-5 w-5" />
        </div>
      )}
      
      {/* Product image */}
      <div className="aspect-square overflow-hidden bg-muted">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Product name */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-card-foreground text-center">
          {product.name}
        </h3>
      </div>
    </button>
  );
};
