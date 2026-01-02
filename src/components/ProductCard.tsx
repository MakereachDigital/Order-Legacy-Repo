import { Product } from "@/types/product";
import { ViewMode } from "./ViewToggle";
import { EditProductDialog } from "./EditProductDialog";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProductCardProps {
  product: Product;
  selectionNumbers: number[];
  onToggle: () => void;
  onEdit: (updatedProduct: Product) => void;
  viewMode?: ViewMode;
  isEditMode?: boolean;
  isSelectedForEdit?: boolean;
  isAuthenticated?: boolean;
}

export const ProductCard = ({ 
  product, 
  selectionNumbers, 
  onToggle, 
  onEdit, 
  viewMode = "medium",
  isEditMode = false,
  isSelectedForEdit = false,
  isAuthenticated = false
}: ProductCardProps) => {
  const isListView = viewMode === "list";
  const isSelected = selectionNumbers.length > 0;
  const showHighlight = isEditMode ? isSelectedForEdit : isSelected;
  
  return (
    <div
      onClick={onToggle}
      className={cn(
        "group relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300",
        "bg-card border hover-lift",
        showHighlight
          ? "ring-2 ring-primary shadow-glow border-primary" 
          : "border-border/60 hover:border-primary/40 hover:shadow-soft-lg",
        isListView && "flex flex-row items-center"
      )}
    >
      {!isEditMode && isAuthenticated && <EditProductDialog product={product} onEditProduct={onEdit} />}
      
      <div className={cn(
        "relative bg-muted/30",
        isListView ? "w-24 h-24 flex-shrink-0" : "aspect-square"
      )}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Edit mode selection overlay */}
        {isEditMode && isSelectedForEdit && (
          <div className="absolute inset-0 bg-primary/25 backdrop-blur-[2px] flex items-center justify-center animate-fade-in">
            <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-glow">
              <Check className="h-5 w-5" strokeWidth={3} />
            </div>
          </div>
        )}
        
        {/* Selection numbers overlay */}
        {!isEditMode && isSelected && (
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent">
            <div className="absolute top-2 right-2 flex flex-wrap gap-1 max-w-[80%] justify-end">
              {selectionNumbers.map((num) => (
                <div 
                  key={num}
                  className="bg-primary text-primary-foreground rounded-full min-w-[26px] h-[26px] flex items-center justify-center text-xs font-bold shadow-glow animate-scale-in px-1.5"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className={cn(
        "p-3 bg-card",
        isListView && "flex-1 py-2"
      )}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn(
            "font-semibold text-card-foreground leading-snug",
            isListView ? "text-sm line-clamp-1" : "text-sm truncate",
            "flex-1"
          )}>
            {product.name}
          </h3>
          {product.sku && (
            <span className="text-[10px] text-muted-foreground font-mono bg-muted/80 px-1.5 py-0.5 rounded-md shrink-0">
              {product.sku}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1.5">
          {product.category && (
            <span className="inline-block text-[10px] text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md font-medium">
              {product.category}
            </span>
          )}
          {product.price && (
            <p className="text-xs text-muted-foreground font-medium">{product.price}</p>
          )}
        </div>
      </div>
    </div>
  );
};