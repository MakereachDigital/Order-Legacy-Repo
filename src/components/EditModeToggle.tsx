import { Button } from "@/components/ui/button";
import { Edit3, X } from "lucide-react";

interface EditModeToggleProps {
  isEditMode: boolean;
  onToggle: () => void;
}

export const EditModeToggle = ({ isEditMode, onToggle }: EditModeToggleProps) => {
  return (
    <Button
      onClick={onToggle}
      variant={isEditMode ? "default" : "ghost"}
      size="sm"
      className="h-8"
    >
      {isEditMode ? (
        <>
          <X className="h-4 w-4 mr-1" />
          Exit
        </>
      ) : (
        <>
          <Edit3 className="h-4 w-4 mr-1" />
          Edit
        </>
      )}
    </Button>
  );
};
