import { Product } from "@/types/product";
import { Check } from "lucide-react";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
}

export const ProductCard = ({ product, isSelected, onToggle }: ProductCardProps) => {
  return (
    <div
      onClick={onToggle}
      className={`group relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 border ${
        isSelected 
          ? "ring-2 ring-primary shadow-xl scale-[1.02] border-primary" 
          : "border-border hover:border-primary/50 hover:shadow-lg"
      }`}
    >
      <div className="aspect-square relative bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
          loading="lazy"
        />
        {isSelected && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-primary rounded-full p-2.5 shadow-lg">
              <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>
      <div className="p-3 bg-card">
        <h3 className="font-medium text-sm text-foreground truncate">
          {product.name}
        </h3>
        {product.price && (
          <p className="text-xs text-muted-foreground mt-1">{product.price}</p>
        )}
      </div>
    </div>
  );
};
