"use client";

import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const Products = () => {
  const { products, updateProduct, addProduct, deleteProduct } = usePOS();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    fullPrice: "",
    halfPrice: "",
    fullStock: "",
    halfStock: "",
    category: "Tahir Fruit Chaat",
    barcode: "",
    isSolo: false,
    imageUrl: "",
    imageFile: null as File | null,
  });

  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: "",
      fullPrice: "",
      halfPrice: "",
      fullStock: "",
      halfStock: "",
      category: "Tahir Fruit Chaat",
      barcode: "",
      isSolo: false,
      imageUrl: "",
      imageFile: null,
    });
    setEditingProduct(null);
  };

  // Add state at the top
  const [loadingProduct, setLoadingProduct] = useState(false);

  // === HANDLE SUBMIT ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProduct(true); // ✅ start loading

    try {
      if (editingProduct) {
        // UPDATE PRODUCT
        await updateProduct(editingProduct, {
          name: formData.name,
          fullPrice: Number(formData.fullPrice),
          halfPrice: Number(formData.halfPrice),
          fullStock: Number(formData.fullStock),
          halfStock: Number(formData.halfStock),
          category: formData.category,
          barcode: formData.barcode,
          isSolo: formData.isSolo,
          imageUrl: formData.imageUrl,
        });
        toast({ title: "Product updated successfully" });
      } else {
        // ADD PRODUCT
        const form = new FormData();
        form.append("name", formData.name);
        form.append("fullPrice", formData.fullPrice);
        form.append("halfPrice", formData.halfPrice);
        form.append("fullStock", formData.fullStock);
        form.append("halfStock", formData.halfStock);
        form.append("category", formData.category);
        form.append("isSolo", String(formData.isSolo));
        if (formData.barcode) form.append("barcode", formData.barcode);
        if (formData.imageFile) form.append("image", formData.imageFile);

        await addProduct(form);
        toast({ title: "Product added successfully" });
      }

      resetForm();
      setIsOpen(false);
    } catch (err: any) {
      console.error("Submit error:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoadingProduct(false); // ✅ stop loading
    }
  };


  // State
  const [loading, setLoading] = useState<string | null>(null);
    // === HANDLE EDIT ===
  const handleEdit = (product: any) => {
    setEditingProduct(product._id);
    setFormData({
      name: product.name,
      fullPrice: product.fullPrice?.toString() || "",
      halfPrice: product.halfPrice?.toString() || "",
      fullStock: product.fullStock?.toString() || "",
      halfStock: product.halfStock?.toString() || "",
      category: product.category || "Tahir Fruit Chaat",
      barcode: product.barcode || "",
      isSolo: product.isSolo || false,
      imageUrl: product.imageUrl || "",
      imageFile: null,
    });
    setIsOpen(true);
  };

  // === HANDLE DELETE ===
  const handleDelete = async (id: string) => {
    try {
      setLoading(id); // show loader only for the specific product

      await deleteProduct(id);
      toast({
        title: "Product deleted successfully",
        variant: "success",
      });
    } catch (err) {
      console.error("Error deleting product:", err);
      toast({
        title: "Delete failed",
        description: "Something went wrong while deleting the product.",
        variant: "destructive",
      });
    } finally {
      setLoading(null); // reset loader
    }
  };

  // === HANDLE IMAGE CHANGE ===
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (formData.imageUrl) URL.revokeObjectURL(formData.imageUrl);
      setFormData({ ...formData, imageUrl: previewUrl, imageFile: file });
    } else {
      setFormData({ ...formData, imageUrl: "", imageFile: null });
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-2xl">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100">
        <CardTitle className="text-2xl font-semibold text-black">
          Product Management
        </CardTitle>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-hover text-white shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-[95vw] sm:max-w-[500px] rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-black">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* === NAME === */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* === PRICES === */}
              <div className={`grid gap-4 ${formData.isSolo ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                <div className="space-y-2">
                  <Label htmlFor="fullPrice">Full Plate Price (PKR)</Label>
                  <Input
                    id="fullPrice"
                    type="number"
                    value={formData.fullPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, fullPrice: e.target.value })
                    }
                    required
                  />
                </div>

                {!formData.isSolo && (
                  <div className="space-y-2">
                    <Label htmlFor="halfPrice">Half Plate Price (PKR)</Label>
                    <Input
                      id="halfPrice"
                      type="number"
                      value={formData.halfPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, halfPrice: e.target.value })
                      }
                      required
                    />
                  </div>
                )}
              </div>

              {/* === STOCKS === */}
              <div className={`grid gap-4 ${formData.isSolo ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                <div className="space-y-2">
                  <Label htmlFor="fullStock">Full Plate Stock</Label>
                  <Input
                    id="fullStock"
                    type="number"
                    value={formData.fullStock}
                    onChange={(e) =>
                      setFormData({ ...formData, fullStock: e.target.value })
                    }
                    required
                  />
                </div>

                {!formData.isSolo && (
                  <div className="space-y-2">
                    <Label htmlFor="halfStock">Half Plate Stock</Label>
                    <Input
                      id="halfStock"
                      type="number"
                      value={formData.halfStock}
                      onChange={(e) =>
                        setFormData({ ...formData, halfStock: e.target.value })
                      }
                      required
                    />
                  </div>
                )}
              </div>


              {/* === SOLO TOGGLE === */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSolo"
                  checked={formData.isSolo}
                  onChange={(e) =>
                    setFormData({ ...formData, isSolo: e.target.checked })
                  }
                />
                <Label htmlFor="isSolo">Solo Item (No Half Plate)</Label>
              </div>

              {/* === CATEGORY === */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                />
              </div>

              {/* === IMAGE === */}
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {formData.imageUrl && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          imageUrl: "",
                          imageFile: null,
                        })
                      }
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-hover text-white shadow-md"
                disabled={loadingProduct} // ✅ disable while loading
              >
                {loadingProduct
                  ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Saving...
                    </div>
                  )
                  : editingProduct
                    ? "Update Product"
                    : "Add Product"
                }
              </Button>

            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      {/* === TABLE === */}
      <CardContent className="p-4 sm:p-6">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-orange-100">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Full Price</TableHead>
                <TableHead>Half Price</TableHead>
                <TableHead>Full Stock</TableHead>
                <TableHead>Half Stock</TableHead>
                <TableHead>Solo</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id} className="hover:bg-muted/5">
                  <TableCell className="font-medium flex items-center gap-3">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    {product.name}
                  </TableCell>
                  <TableCell>{product.fullPrice} PKR</TableCell>
                  <TableCell>
                    {product.isSolo ? "—" : `${product.halfPrice} PKR`}
                  </TableCell>
                  <TableCell>{product.fullStock}</TableCell>
                  <TableCell>
                    {product.isSolo ? "—" : product.halfStock}
                  </TableCell>
                  <TableCell>{product.isSolo ? "✅" : "❌"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product._id)}
                        disabled={loading === product._id} // disable while deleting
                      >
                        {loading === product._id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>

                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default Products;
