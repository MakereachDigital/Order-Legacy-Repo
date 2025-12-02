import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Trash2, CheckSquare } from "lucide-react";
import { BulkEditDialog, BulkChanges } from "./BulkEditDialog";

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
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 border border-border rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Click products to select them
          </p>
          <Button onClick={onSelectAll} variant="outline" size="sm" className="h-7">
            <CheckSquare className="h-3 w-3 mr-1" />
            Select All
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 border border-border rounded-lg px-4 py-3 shadow-xl min-w-80">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedForEdit.length} selected
        </span>
        
        <BulkEditDialog 
          selectedCount={selectedForEdit.length}
          onApply={handleBulkEdit}
        />

        <Button
          onClick={() => onDelete(selectedForEdit)}
          variant="destructive"
          size="sm"
          className="h-8"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>

        <Button
          onClick={onClearSelection}
          variant="ghost"
          size="sm"
          className="h-8"
        >
          Clear
        </Button>
      </div>
    </div>
  );
};
