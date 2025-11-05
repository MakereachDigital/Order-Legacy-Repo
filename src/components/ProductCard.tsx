import { Product } from "@/types/product";
import { ViewMode } from "./ViewToggle";
import { EditProductDialog } from "./EditProductDialog";

interface ProductCardProps {
  product: Product;
  selectionNumbers: number[];
  onToggle: () => void;
  onEdit: (updatedProduct: Product) => void;
  viewMode?: ViewMode;
  isEditMode?: boolean;
  isSelectedForEdit?: boolean;
}

export const ProductCard = ({ 
  product, 
  selectionNumbers, 
  onToggle, 
  onEdit, 
  viewMode = "medium",
  isEditMode = false,
  isSelectedForEdit = false
}: ProductCardProps) => {
  const isListView = viewMode === "list";
  const isSelected = selectionNumbers.length > 0;
  const showHighlight = isEditMode ? isSelectedForEdit : isSelected;
  
  return (
    <div
      onClick={onToggle}
      className={`group relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 border ${
        showHighlight
          ? "ring-2 ring-primary shadow-xl scale-[1.02] border-primary" 
          : "border-border hover:border-primary/50 hover:shadow-lg"
      } ${isListView ? "flex flex-row items-center" : ""}`}
    >
      {!isEditMode && <EditProductDialog product={product} onEditProduct={onEdit} />}
      <div className={`${isListView ? "w-28 h-28 flex-shrink-0" : "aspect-square"} relative bg-muted`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
          loading="lazy"
        />
        {isEditMode && isSelectedForEdit && (
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg">
              ✓
            </div>
          </div>
        )}
        {!isEditMode && isSelected && (
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
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-medium ${isListView ? "text-base" : "text-sm"} text-foreground ${isListView ? "line-clamp-1" : "truncate"} flex-1`}>
            {product.name}
          </h3>
          {product.sku && (
            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">
              {product.sku}
            </span>
          )}
        </div>
        {product.category && (
          <span className="inline-block text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded mt-1">
            {product.category}
          </span>
        )}
        {product.price && (
          <p className={`${isListView ? "text-sm" : "text-xs"} text-muted-foreground mt-1`}>{product.price}</p>
        )}
      </div>
    </div>
  );
};
