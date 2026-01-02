import { LayoutGrid, List, Grid3x3 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "small" | "medium" | "large" | "list";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewToggle = ({ viewMode, onViewModeChange }: ViewToggleProps) => {
  const toggleItems = [
    { mode: "small" as const, icon: Grid3x3, title: "Small grid" },
    { mode: "medium" as const, icon: LayoutGrid, title: "Medium grid" },
    { mode: "list" as const, icon: List, title: "List view" },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-muted/60 rounded-xl p-1 border border-border/50">
      {toggleItems.map(({ mode, icon: Icon, title }) => (
        <Button
          key={mode}
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange(mode)}
          className={cn(
            "h-8 w-8 p-0 rounded-lg transition-all duration-200",
            viewMode === mode 
              ? "bg-card shadow-soft text-primary" 
              : "hover:bg-card/50 text-muted-foreground"
          )}
          title={title}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
};