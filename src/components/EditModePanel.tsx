import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Trash2, CheckSquare, X } from "lucide-react";
import { BulkEditDialog, BulkChanges } from "./BulkEditDialog";
import { cn } from "@/lib/utils";

interface EditModePanelProps {
  selectedForEdit: string[];
  products: Product[];
  onBulkEdit: (productIds: string[], changes: BulkChanges) => void;
  onDelete: (productIds: string[]) => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
}

export const EditModePanel = ({
  selectedForEdit,
  products,
  onBulkEdit,
  onDelete,
  onClearSelection,
  onSelectAll,
}: EditModePanelProps) => {
  const handleBulkEdit = (changes: BulkChanges) => {
    onBulkEdit(selectedForEdit, changes);
  };

  if (selectedForEdit.length === 0) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-2xl px-5 py-3 shadow-soft-lg animate-slide-up">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            Click products to select them
          </p>
          <Button 
            onClick={onSelectAll} 
            variant="secondary" 
            size="sm" 
            className="h-8 gap-1.5 rounded-lg"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Select All
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-2xl px-5 py-3 shadow-soft-lg min-w-80 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <span className="text-sm font-semibold text-foreground">
            {selectedForEdit.length}
          </span>
          <span className="text-sm text-muted-foreground">
            selected
          </span>
        </div>
        
        <BulkEditDialog 
          selectedCount={selectedForEdit.length}
          onApply={handleBulkEdit}
        />

        <Button
          onClick={() => onDelete(selectedForEdit)}
          variant="destructive"
          size="sm"
          className="h-9 gap-1.5 rounded-lg"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>

        <Button
          onClick={onClearSelection}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg ml-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};