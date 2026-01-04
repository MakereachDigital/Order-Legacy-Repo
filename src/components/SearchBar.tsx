import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative w-full max-w-xs group">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <Input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "pl-9 pr-8 h-9 bg-muted/50 border-border/60 rounded-xl text-sm",
          "placeholder:text-muted-foreground/60",
          "focus:bg-card focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
          "transition-all duration-200"
        )}
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 rounded-lg hover:bg-muted"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
};