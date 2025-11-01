import { Product } from "@/types/product";
import { ViewMode } from "./ViewToggle";

interface ProductCardProps {
  product: Product;
  selectionNumbers: number[];
  onToggle: () => void;
  viewMode?: ViewMode;
}

export const ProductCard = ({ product, selectionNumbers, onToggle, viewMode = "medium" }: ProductCardProps) => {
  const isListView = viewMode === "list";
  const isSelected = selectionNumbers.length > 0;
  
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
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px]">
            <div className="absolute top-2 right-2 flex flex-wrap gap-1 max-w-[80%] justify-end">
              {selectionNumbers.map((num) => (
                <div 
                  key={num}
                  className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg"
                >
                  {num}
                </div>
              ))}
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
