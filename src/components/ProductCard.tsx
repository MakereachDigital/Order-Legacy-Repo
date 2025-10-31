import { Product } from "@/types/product";
import { Check } from "lucide-react";
import { ViewMode } from "./ViewToggle";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
  viewMode?: ViewMode;
}

export const ProductCard = ({ product, isSelected, onToggle, viewMode = "medium" }: ProductCardProps) => {
  const isListView = viewMode === "list";
  
  return (
    <div
      onClick={onToggle}
      className={`group relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 border ${
        isSelected 
          ? "ring-2 ring-primary shadow-xl scale-[1.02] border-primary" 
          : "border-border hover:border-primary/50 hover:shadow-lg"
      } ${isListView ? "flex flex-row items-center" : ""}`}
    >
      <div className={`${isListView ? "w-28 h-28 flex-shrink-0" : "aspect-square"} relative bg-muted`}>
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
      <div className={`p-3 bg-card ${isListView ? "flex-1" : ""}`}>
        <h3 className={`font-medium ${isListView ? "text-base" : "text-sm"} text-foreground ${isListView ? "line-clamp-1" : "truncate"}`}>
          {product.name}
        </h3>
        {product.price && (
          <p className={`${isListView ? "text-sm" : "text-xs"} text-muted-foreground mt-1`}>{product.price}</p>
        )}
      </div>
    </div>
  );
};
