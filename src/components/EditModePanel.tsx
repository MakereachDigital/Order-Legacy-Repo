import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag, Trash2 } from "lucide-react";

interface EditModePanelProps {
  selectedForEdit: string[];
  products: Product[];
  onCategoryChange: (productIds: string[], category: Product["category"]) => void;
  onDelete: (productIds: string[]) => void;
  onClearSelection: () => void;
}

export const EditModePanel = ({
  selectedForEdit,
  products,
  onCategoryChange,
  onDelete,
  onClearSelection,
}: EditModePanelProps) => {
  const handleCategoryChange = (category: string) => {
    onCategoryChange(selectedForEdit, category as Product["category"]);
  };

  if (selectedForEdit.length === 0) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 border border-border rounded-lg px-4 py-2 shadow-lg">
        <p className="text-sm text-muted-foreground">
          Click products to select them for bulk editing
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 border border-border rounded-lg px-4 py-3 shadow-xl min-w-80">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedForEdit.length} selected
        </span>
        
        <Select onValueChange={handleCategoryChange}>
          <SelectTrigger className="h-8 w-32">
            <Tag className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cufflinks">Cufflinks</SelectItem>
            <SelectItem value="Ties">Ties</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

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
