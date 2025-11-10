import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { legacyProducts } from "@/data/legacyProducts";
import { ProductGrid } from "@/components/ProductGrid";
import { OrderImageGenerator } from "@/components/OrderImageGenerator";
import { SearchBar } from "@/components/SearchBar";
import { AddProductDialog } from "@/components/AddProductDialog";
import { ReceiptUploader } from "@/components/ReceiptUploader";
import { ImportProductsDialog } from "@/components/ImportProductsDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EditModeToggle } from "@/components/EditModeToggle";
import { EditModePanel } from "@/components/EditModePanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageIcon, Package, FileText, LogIn, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>(legacyProducts);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("medium");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<string[]>([]);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");

  // Authentication setup
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin role when session changes
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!error && data) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    toast.success("Logged out successfully");
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const handleToggleProduct = (product: Product) => {
    if (isEditMode) {
      // Edit mode: toggle selection for editing
      setSelectedForEdit((prev) =>
        prev.includes(product.id)
          ? prev.filter((id) => id !== product.id)
          : [...prev, product.id]
      );
    } else {
      // Normal mode: add to order
      setSelectedProducts((prev) => [...prev, product]);
    }
  };

  const handleRemoveSelection = (index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateImage = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    setShowGenerator(true);
  };

  const handleClearSelection = () => {
    setSelectedProducts([]);
    toast.success("Selection cleared");
  };

  const getSelectionNumbers = (productId: string): number[] => {
    return selectedProducts
      .map((p, index) => (p.id === productId ? index + 1 : -1))
      .filter((num) => num !== -1);
  };

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const handleImportProducts = (importedProducts: Product[]) => {
    setProducts((prev) => [...prev, ...importedProducts]);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    // Update selected products as well
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const handleBulkCategoryChange = (productIds: string[], category: Product["category"]) => {
    setProducts((prev) =>
      prev.map((p) => (productIds.includes(p.id) ? { ...p, category } : p))
    );
    toast.success(`Updated ${productIds.length} product(s)`);
    setSelectedForEdit([]);
  };

  const handleBulkDelete = (productIds: string[]) => {
    setProducts((prev) => prev.filter((p) => !productIds.includes(p.id)));
    toast.success(`Deleted ${productIds.length} product(s)`);
    setSelectedForEdit([]);
  };

  const handleProductsExtracted = (extractedProducts: Array<{ sku: string; name: string; quantity: number }>) => {
    const newSelectedProducts: Product[] = [];
    const notFoundProducts: string[] = [];

    extractedProducts.forEach(extracted => {
      // Try to find by SKU first (highest priority)
      let matchedProduct = products.find(p => 
        p.sku && p.sku.toLowerCase() === extracted.sku.toLowerCase()
      );

      // If no SKU match, try fuzzy name matching
      if (!matchedProduct && extracted.name) {
        const searchName = extracted.name.toLowerCase();
        matchedProduct = products.find(p => {
          const productName = p.name.toLowerCase();
          return productName.includes(searchName) || searchName.includes(productName);
        });
      }

      if (matchedProduct) {
        // Add the product once with quantity info
        newSelectedProducts.push({ ...matchedProduct, quantity: extracted.quantity });
      } else {
        notFoundProducts.push(`${extracted.name} (${extracted.sku || 'No SKU'})`);
      }
    });

    if (newSelectedProducts.length > 0) {
      setSelectedProducts(prev => [...prev, ...newSelectedProducts]);
      toast.success(`Added ${newSelectedProducts.length} product(s) to order`);
      
      // Close receipt dialog and auto-open generator with receipt attached
      setShowReceiptDialog(false);
      setTimeout(() => {
        setShowGenerator(true);
      }, 300);
    }

    if (notFoundProducts.length > 0) {
      toast.error(`Could not find: ${notFoundProducts.join(", ")}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Sticky Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border shadow-sm">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-md">
                <Package className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-none">Legacy Dhaka</h1>
                <p className="text-[10px] text-muted-foreground">Order Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <CategoryFilter 
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
              {isAdmin && (
                <EditModeToggle 
                  isEditMode={isEditMode}
                  onToggle={() => {
                    setIsEditMode(!isEditMode);
                    setSelectedForEdit([]);
                  }}
                />
              )}
              <ThemeToggle />
              {user ? (
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="h-8"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  variant="ghost"
                  size="sm"
                  className="h-8"
                >
                  <LogIn className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search & Actions Bar */}
      <div className="sticky top-[53px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container mx-auto px-3 py-2.5">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              
              {/* Receipt Button */}
              {!isEditMode && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Smart Receipt Upload</DialogTitle>
                          </DialogHeader>
                          <ReceiptUploader
                            onProductsExtracted={handleProductsExtracted}
                            receiptFile={receiptFile}
                            setReceiptFile={setReceiptFile}
                            receiptPreview={receiptPreview}
                            setReceiptPreview={setReceiptPreview}
                          />
                        </DialogContent>
                      </Dialog>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload Receipt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Import Button - Admin Only */}
              {!isEditMode && isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ImportProductsDialog onImportProducts={handleImportProducts} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Import from URLs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              {!isEditMode && user && <AddProductDialog onAddProduct={handleAddProduct} />}
              {!isEditMode && selectedProducts.length > 0 && (
                <Button
                  onClick={handleClearSelection}
                  variant="ghost"
                  size="sm"
                  className="h-8"
                >
                  Clear ({selectedProducts.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="pb-24">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or add a custom product</p>
          </div>
        ) : (
        <ProductGrid
          products={filteredProducts}
          selectedProducts={selectedProducts}
          onToggleProduct={handleToggleProduct}
          onEditProduct={handleEditProduct}
          getSelectionNumbers={getSelectionNumbers}
          viewMode={viewMode}
          isEditMode={isEditMode}
          selectedForEdit={selectedForEdit}
          isAuthenticated={!!user}
        />
        )}
      </main>

      {/* Edit Mode Panel */}
      {isEditMode && (
        <EditModePanel
          selectedForEdit={selectedForEdit}
          products={products}
          onCategoryChange={handleBulkCategoryChange}
          onDelete={handleBulkDelete}
          onClearSelection={() => setSelectedForEdit([])}
        />
      )}

      {/* Bottom Action Bar with Thumbnails */}
      {!isEditMode && selectedProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-3 space-y-3">
            {/* Thumbnail Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {selectedProducts.map((product, index) => (
              <div
                key={index}
                onClick={() => handleRemoveSelection(index)}
                className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-primary cursor-pointer hover:opacity-75 transition-opacity"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.sku && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[8px] font-bold text-center py-0.5 truncate px-1">
                    {product.sku}
                  </div>
                )}
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-bl-lg flex items-center justify-center">
                  {index + 1}
                </div>
              </div>
            ))}
            </div>
            
            {/* Generate Button */}
            <Button
              onClick={handleGenerateImage}
              className="w-full"
              size="lg"
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              Generate Order Image ({selectedProducts.length} items)
            </Button>
          </div>
        </div>
      )}

      {/* Order Image Generator Modal */}
      {showGenerator && (
        <OrderImageGenerator
          selectedProducts={selectedProducts}
          onClose={() => {
            setShowGenerator(false);
            setReceiptFile(null);
            setReceiptPreview("");
          }}
          initialReceiptFile={receiptFile}
          initialReceiptPreview={receiptPreview}
        />
      )}
    </div>
  );
};

export default Index;
