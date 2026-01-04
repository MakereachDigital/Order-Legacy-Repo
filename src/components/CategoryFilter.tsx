import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const categories = ["Cufflinks", "Ties"];

  return (
    <div className="flex items-center gap-0.5 bg-secondary/80 rounded-xl p-0.5 border border-primary/20 shadow-sm">
      <Button
        onClick={() => onCategoryChange(null)}
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 text-xs rounded-lg font-semibold transition-all duration-200",
          selectedCategory === null 
            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
            : "text-foreground hover:bg-muted/80"
        )}
      >
        <Tag className="h-3 w-3 mr-1" />
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          onClick={() => onCategoryChange(category)}
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 text-xs rounded-lg font-semibold transition-all duration-200",
            selectedCategory === category 
              ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
              : "text-foreground hover:bg-muted/80"
          )}
        >
          {category}
        </Button>
      ))}
    </div>
  );
};