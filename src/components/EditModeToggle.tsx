import { Button } from "@/components/ui/button";
import { Edit3, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditModeToggleProps {
  isEditMode: boolean;
  onToggle: () => void;
}

export const EditModeToggle = ({ isEditMode, onToggle }: EditModeToggleProps) => {
  return (
    <Button
      onClick={onToggle}
      variant={isEditMode ? "default" : "outline"}
      size="sm"
      className={cn(
        "h-9 gap-1.5 font-medium transition-all duration-200",
        isEditMode && "shadow-glow"
      )}
    >
      {isEditMode ? (
        <>
          <X className="h-4 w-4" />
          Exit Edit
        </>
      ) : (
        <>
          <Edit3 className="h-4 w-4" />
          Edit
        </>
      )}
    </Button>
  );
};