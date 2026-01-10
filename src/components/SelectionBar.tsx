import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionBarProps {
  selectedProducts: Product[];
  onRemoveSelection: (index: number) => void;
  onGenerateImage: () => void;
  onClearSelection: () => void;
}

export const SelectionBar = ({
  selectedProducts,
  onRemoveSelection,
  onGenerateImage,
  onClearSelection,
}: SelectionBarProps) => {
  if (selectedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/98 to-background/90 backdrop-blur-xl" />
      
      <div className="relative container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Selection counter badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-glow">
              {selectedProducts.length} {selectedProducts.length === 1 ? 'item' : 'items'}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Tap to remove
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear all</span>
          </Button>
        </div>

        {/* Thumbnail strip - Premium horizontal scroll */}
        <div className="relative mb-3">
          {/* Fade edges for scroll indication */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <div className="flex gap-2 sm:gap-3 overflow-x-auto py-1 px-1 scrollbar-none scroll-smooth snap-x snap-mandatory">
            {selectedProducts.map((product, index) => (
              <div
                key={`${product.id}-${index}`}
                onClick={() => onRemoveSelection(index)}
                className={cn(
                  "group relative flex-shrink-0 snap-start cursor-pointer",
                  "transition-all duration-200 ease-out",
                  "hover:scale-95 active:scale-90"
                )}
              >
                {/* Thumbnail container */}
                <div className={cn(
                  "relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden",
                  "ring-2 ring-primary/50 group-hover:ring-destructive",
                  "shadow-soft group-hover:shadow-none",
                  "transition-all duration-200"
                )}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-destructive/0 group-hover:bg-destructive/20 transition-colors duration-200 flex items-center justify-center">
                    <X className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" />
                  </div>
                  
                  {/* Index badge - top right */}
                  <div className={cn(
                    "absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5",
                    "bg-primary text-primary-foreground",
                    "text-[10px] font-bold rounded-full",
                    "flex items-center justify-center",
                    "shadow-glow border-2 border-background"
                  )}>
                    {index + 1}
                  </div>
                  
                  {/* SKU badge - bottom */}
                  {product.sku && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent pt-3 pb-0.5">
                      <p className="text-[8px] sm:text-[9px] font-mono font-semibold text-white text-center truncate px-1">
                        {product.sku}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate button - Premium style with gradient glow */}
        <div className="relative group/btn">
          {/* Animated glow background */}
          <div className={cn(
            "absolute -inset-0.5 rounded-xl opacity-60 blur-md transition-all duration-300",
            "bg-gradient-to-r from-primary via-accent to-primary",
            "group-hover/btn:opacity-90 group-hover/btn:blur-lg group-hover/btn:-inset-1"
          )} />
          
          <Button
            onClick={onGenerateImage}
            size="lg"
            className={cn(
              "relative w-full h-12 sm:h-14 text-sm sm:text-base font-bold",
              "bg-gradient-to-r from-primary via-primary to-accent",
              "hover:from-primary/95 hover:via-accent/90 hover:to-primary/95",
              "shadow-glow hover:shadow-glow-lg",
              "transition-all duration-300 ease-out",
              "rounded-xl border border-primary-foreground/10",
              "group-hover/btn:scale-[1.01]"
            )}
          >
            <ImageIcon className="mr-2 h-5 w-5" />
            Generate Order Image
          </Button>
        </div>
      </div>
    </div>
  );
};
