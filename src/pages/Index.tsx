import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { User } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [generatorProducts, setGeneratorProducts] = useState<Product[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("small");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<string[]>([]);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");

  const loadPermissions = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-products", {
        body: { action: "get_permissions" },
      });

      if (error) throw error;
      setIsAdmin(Boolean((data as any)?.isAdmin));
    } catch (error) {
      console.error("[INTERNAL] Permissions load error:", error);
      setIsAdmin(false);
    }
  }, []);

  // Load products from database
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Set products from database (empty array if no products)
      setProducts((data || []).map(p => ({
        id: p.id,
        name: p.name,
        image: p.image,
        price: p.price || undefined,
        sku: p.sku || undefined,
        category: p.category as Product["category"] || undefined,
      })));
    } catch (error) {
      // Internal logging only
      console.error("[INTERNAL] Products load error:", error);
      toast.error("Unable to load products. Please try again.");
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Authentication setup
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);

        if (nextUser) {
          setTimeout(() => {
            void loadPermissions();
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        void loadPermissions();
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadPermissions]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
    setGeneratorProducts([...selectedProducts]);
    setShowGenerator(true);
    setSelectedProducts([]);
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

  const invokeAdminProducts = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-products", {
      body,
    });

    if (error) throw error;
    return data as any;
  }, []);

  const handleAddProduct = async (product: Product) => {
    // Save to database (server-side role check)
    try {
      await invokeAdminProducts({ action: "insert", product });
      setProducts((prev) => [...prev, product]);
    } catch (error) {
      console.error("[INTERNAL] Product insert error:", error);
      toast.error("You don't have permission to add products.");
    }
  };

  const handleImportProducts = async (importedProducts: Product[]) => {
    try {
      await invokeAdminProducts({ action: "bulk_insert", products: importedProducts });
      setProducts((prev) => [...prev, ...importedProducts]);
    } catch (error) {
      console.error("[INTERNAL] Import products error:", error);
      toast.error("You don't have permission to import products.");
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      await invokeAdminProducts({
        action: "update",
        id: updatedProduct.id,
        updates: {
          name: updatedProduct.name,
          image: updatedProduct.image,
          price: updatedProduct.price ?? null,
          sku: updatedProduct.sku ?? null,
          category: updatedProduct.category ?? null,
        },
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );

      // Update selected products as well
      setSelectedProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );
    } catch (error) {
      console.error("[INTERNAL] Product update error:", error);
      toast.error("You don't have permission to edit products.");
    }
  };

  const handleBulkEdit = async (productIds: string[], changes: { 
    category?: Product["category"]; 
    pricePrefix?: string; 
    priceSuffix?: string;
    namePrefix?: string;
    nameSuffix?: string;
  }) => {
    const updatesPayload: Array<{ id: string; updates: Partial<Product> }> = [];

    for (const id of productIds) {
      const existing = products.find((p) => p.id === id);
      if (!existing) continue;

      const updates: Partial<Product> = {};

      if (changes.category) updates.category = changes.category;

      if (changes.namePrefix || changes.nameSuffix) {
        updates.name = `${changes.namePrefix || ""}${existing.name}${changes.nameSuffix || ""}`;
      }

      if (changes.pricePrefix || changes.priceSuffix) {
        const currentPrice = existing.price || "";
        updates.price = `${changes.pricePrefix || ""}${currentPrice}${changes.priceSuffix || ""}`;
      }

      if (Object.keys(updates).length > 0) {
        updatesPayload.push({ id, updates });
      }
    }

    if (updatesPayload.length === 0) return;

    try {
      await invokeAdminProducts({ action: "bulk_update", updates: updatesPayload });

      const updatesById = new Map<string, Partial<Product>>(
        updatesPayload.map((u) => [u.id, u.updates])
      );

      setProducts((prev) =>
        prev.map((p) => {
          const u = updatesById.get(p.id);
          return u ? { ...p, ...u } : p;
        })
      );

      toast.success(`Updated ${updatesPayload.length} product(s)`);
      setSelectedForEdit([]);
    } catch (error) {
      console.error("[INTERNAL] Bulk update error:", error);
      toast.error("You don't have permission to edit products.");
      // Re-sync UI with database
      void loadProducts();
    }
  };

  const handleBulkDelete = async (productIds: string[]) => {
    try {
      await invokeAdminProducts({ action: "bulk_delete", ids: productIds });

      setProducts((prev) => prev.filter((p) => !productIds.includes(p.id)));
      toast.success(`Deleted ${productIds.length} product(s)`);
      setSelectedForEdit([]);
    } catch (error) {
      console.error("[INTERNAL] Delete products error:", error);
      toast.error("You don't have permission to delete products.");
      // Re-sync UI with database
      void loadProducts();
    }
  };

  const handleProductsExtracted = (extractedProducts: Array<{ sku: string; name: string; quantity: number }>) => {
    const newSelectedProducts: Product[] = [];
    const notFoundProducts: string[] = [];

    extractedProducts.forEach(extracted => {
      let matchedProduct: Product | undefined = undefined;
      
      // Try to find by SKU first (highest priority) - if SKU exists in extracted data
      if (extracted.sku) {
        matchedProduct = products.find(p => 
          p.sku && p.sku.toLowerCase() === extracted.sku.toLowerCase()
        );
      }

      // If no SKU match, try fuzzy name matching
      if (!matchedProduct && extracted.name) {
        const searchName = extracted.name.toLowerCase().trim();
        // Try exact match first
        matchedProduct = products.find(p => 
          p.name.toLowerCase().trim() === searchName
        );
        
        // Try partial match if no exact match
        if (!matchedProduct) {
          matchedProduct = products.find(p => {
            const productName = p.name.toLowerCase().trim();
            return productName.includes(searchName) || searchName.includes(productName);
          });
        }
      }

      if (matchedProduct) {
        // Add the product once with quantity info
        newSelectedProducts.push({ ...matchedProduct, quantity: extracted.quantity });
      } else {
        notFoundProducts.push(`${extracted.name || 'Unknown'} (${extracted.sku || 'No SKU'})`);
      }
    });

    if (newSelectedProducts.length > 0) {
      setSelectedProducts(prev => [...prev, ...newSelectedProducts]);
      toast.success(`Added ${newSelectedProducts.length} product(s) to order`);
      
      // Close receipt dialog and auto-open generator with receipt attached
      setShowReceiptDialog(false);
      // Set generator products BEFORE showing generator
      setGeneratorProducts(newSelectedProducts);
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
              
              {/* Import Button - Extract from Links */}
              {!isEditMode && isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ImportProductsDialog onImportProducts={handleImportProducts} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Import Products</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Edit Mode Toggle - beside Import */}
              {isAdmin && (
                <EditModeToggle 
                  isEditMode={isEditMode}
                  onToggle={() => {
                    setIsEditMode(!isEditMode);
                    setSelectedForEdit([]);
                  }}
                />
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              {!isEditMode && user && isAdmin && <AddProductDialog onAddProduct={handleAddProduct} />}
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
          onBulkEdit={handleBulkEdit}
          onDelete={handleBulkDelete}
          onClearSelection={() => setSelectedForEdit([])}
          onSelectAll={() => setSelectedForEdit(filteredProducts.map(p => p.id))}
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
          selectedProducts={generatorProducts}
          onClose={() => {
            setShowGenerator(false);
            setGeneratorProducts([]);
            setReceiptFile(null);
            setReceiptPreview("");
          }}
          onResetSelection={() => setSelectedProducts([])}
          initialReceiptFile={receiptFile}
          initialReceiptPreview={receiptPreview}
        />
      )}
    </div>
  );
};

export default Index;
