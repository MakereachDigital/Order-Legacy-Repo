import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const categories = ["Cufflinks", "Ties"];

  return (
    <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 border border-border/50">
      <Button
        onClick={() => onCategoryChange(null)}
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-3 text-xs rounded-lg font-medium transition-all duration-200",
          selectedCategory === null 
            ? "bg-card shadow-soft text-primary" 
            : "hover:bg-card/50 text-muted-foreground"
        )}
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          onClick={() => onCategoryChange(category)}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-3 text-xs rounded-lg font-medium transition-all duration-200",
            selectedCategory === category 
              ? "bg-card shadow-soft text-primary" 
              : "hover:bg-card/50 text-muted-foreground"
          )}
        >
          {category}
        </Button>
      ))}
    </div>
  );
};