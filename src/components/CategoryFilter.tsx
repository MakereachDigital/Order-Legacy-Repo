import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const categories = ["Cufflinks", "Ties"];

  return (
    <div className="flex items-center gap-2">
      <Tag className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        <Button
          onClick={() => onCategoryChange(null)}
          variant={selectedCategory === null ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => onCategoryChange(category)}
            variant={selectedCategory === category ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
};
