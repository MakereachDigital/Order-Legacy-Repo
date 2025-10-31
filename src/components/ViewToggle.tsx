import { LayoutGrid, List, Grid3x3 } from "lucide-react";
import { Button } from "./ui/button";

export type ViewMode = "small" | "medium" | "large" | "list";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewToggle = ({ viewMode, onViewModeChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Button
        variant={viewMode === "small" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("small")}
        className="h-8 w-8 p-0"
        title="Small grid"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "medium" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("medium")}
        className="h-8 w-8 p-0"
        title="Medium grid"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("list")}
        className="h-8 w-8 p-0"
        title="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};
