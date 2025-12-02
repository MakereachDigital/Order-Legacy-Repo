import { useState } from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";

interface BulkEditDialogProps {
  selectedCount: number;
  onApply: (changes: BulkChanges) => void;
}

export interface BulkChanges {
  category?: Product["category"];
  pricePrefix?: string;
  priceSuffix?: string;
  namePrefix?: string;
  nameSuffix?: string;
}

export const BulkEditDialog = ({ selectedCount, onApply }: BulkEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [pricePrefix, setPricePrefix] = useState("");
  const [priceSuffix, setPriceSuffix] = useState("");
  const [namePrefix, setNamePrefix] = useState("");
  const [nameSuffix, setNameSuffix] = useState("");

  const handleApply = () => {
    const changes: BulkChanges = {};
    
    if (category) {
      changes.category = category as Product["category"];
    }
    if (pricePrefix) changes.pricePrefix = pricePrefix;
    if (priceSuffix) changes.priceSuffix = priceSuffix;
    if (namePrefix) changes.namePrefix = namePrefix;
    if (nameSuffix) changes.nameSuffix = nameSuffix;

    if (Object.keys(changes).length > 0) {
      onApply(changes);
      setOpen(false);
      // Reset form
      setCategory("");
      setPricePrefix("");
      setPriceSuffix("");
      setNamePrefix("");
      setNameSuffix("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedCount} Products</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Keep existing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cufflinks">Cufflinks</SelectItem>
                <SelectItem value="Ties">Ties</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Name Prefix</Label>
              <Input
                value={namePrefix}
                onChange={(e) => setNamePrefix(e.target.value)}
                placeholder="Add before name"
              />
            </div>
            <div className="space-y-2">
              <Label>Name Suffix</Label>
              <Input
                value={nameSuffix}
                onChange={(e) => setNameSuffix(e.target.value)}
                placeholder="Add after name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Price Prefix</Label>
              <Input
                value={pricePrefix}
                onChange={(e) => setPricePrefix(e.target.value)}
                placeholder="e.g. ৳"
              />
            </div>
            <div className="space-y-2">
              <Label>Price Suffix</Label>
              <Input
                value={priceSuffix}
                onChange={(e) => setPriceSuffix(e.target.value)}
                placeholder="e.g. BDT"
              />
            </div>
          </div>

          <Button onClick={handleApply} className="w-full">
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
