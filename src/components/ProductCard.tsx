import { Product } from "@/types/product";
import { ViewMode } from "./ViewToggle";
import { EditProductDialog } from "./EditProductDialog";
import { cn } from "@/lib/utils";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { Check, Plus } from "lucide-react";

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
  const selectionCount = selectionNumbers.length;
  
  return (
    <div
      onClick={onToggle}
      className={cn(
        "group relative cursor-pointer overflow-hidden",
        "bg-card/50 backdrop-blur-sm border border-white/5 dark:border-white/5",
        "rounded-2xl transition-all duration-300 ease-out",
        showHighlight
          ? "ring-2 ring-primary border-primary/40 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] scale-[0.98]"
          : "hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_hsl(var(--primary)/0.25)]",
        isListView && "flex flex-row items-center rounded-xl"
      )}
    >
      {/* Hover gradient sheen */}
      {!showHighlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-opacity duration-500 pointer-events-none rounded-2xl" />
      )}

      {!isEditMode && isAuthenticated && <EditProductDialog product={product} onEditProduct={onEdit} />}

      <div className={cn(
        "relative overflow-hidden",
        isListView ? "w-24 h-24 flex-shrink-0 rounded-xl m-1.5" : "aspect-square rounded-t-2xl bg-background/40"
      )}>
        <img
          src={getProxiedImageUrl(product.image)}
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-all duration-500 ease-out",
            showHighlight ? "scale-110" : "group-hover:scale-105"
          )}
          loading="lazy"
        />

        {/* Edit mode selection overlay */}
        {isEditMode && isSelectedForEdit && (
          <div className="absolute inset-0 bg-primary/30 backdrop-blur-[2px] flex items-center justify-center animate-fade-in">
            <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.6)] animate-scale-in">
              <Check className="h-5 w-5" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Selection badge */}
        {!isEditMode && isSelected && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-primary/10 to-transparent pointer-events-none animate-fade-in" />
            <div className={cn(
              "absolute top-2 right-2 z-10",
              "min-w-[28px] h-7 px-2",
              "bg-primary text-primary-foreground",
              "rounded-full font-bold text-sm",
              "flex items-center justify-center gap-1",
              "shadow-[0_0_18px_hsl(var(--primary)/0.6)] animate-scale-in",
              "ring-2 ring-background"
            )}>
              {selectionCount > 1 && <span>×</span>}
              {selectionCount}
            </div>
          </>
        )}

        {/* Hover add indicator */}
        {!isEditMode && !isSelected && (
          <div className="absolute inset-0 flex items-center justify-center transition-all duration-300">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.6)]",
              "opacity-0 group-hover:opacity-100",
              "scale-50 group-hover:scale-100",
              "transition-all duration-300 ease-out",
              "backdrop-blur-sm"
            )}>
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </div>
          </div>
        )}
      </div>

      <div className={cn(
        "p-3 sm:p-3.5 relative",
        isListView && "flex-1 py-2 pr-3"
      )}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          {product.category && (
            <span className="text-[9px] font-bold tracking-[0.12em] text-primary uppercase truncate">
              {product.category}
            </span>
          )}
          {product.sku && (
            <span className="text-[10px] text-muted-foreground/80 font-mono shrink-0">
              #{product.sku}
            </span>
          )}
        </div>
        <h3 className={cn(
          "font-semibold text-card-foreground leading-snug font-display",
          isListView ? "text-sm line-clamp-1" : "text-sm truncate"
        )}>
          {product.name}
        </h3>
        {product.price && (
          <p className="text-xs text-muted-foreground font-medium mt-1">{product.price}</p>
        )}
      </div>
    </div>
  );
};