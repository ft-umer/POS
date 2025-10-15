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
import { Plus, Pencil, Trash2 } from "lucide-react";

const Products = () => {
  const { products,updateProduct, addProduct, deleteProduct } = usePOS();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    fullPrice: "",
    halfPrice: "",
    stock: "",
    category: "Tahir Fruit Chaat",
    barcode: "",
    imageUrl: "",
    imageFile: null as File | null,
  });

  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: "",
      fullPrice: "",
      halfPrice: "",
      stock: "",
      category: "Tahir Fruit Chaat",
      barcode: "",
      imageUrl: "",
      imageFile: null,
    });
    setEditingProduct(null);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (editingProduct) {
      // For updates, call context updateProduct
      await updateProduct(editingProduct, {
        name: formData.name,
        fullPrice: Number(formData.fullPrice),
        halfPrice: Number(formData.halfPrice),
        stock: Number(formData.stock),
        category: formData.category,
        barcode: formData.barcode,
        imageUrl: formData.imageUrl,
      });
      toast({ title: "Product updated successfully" });
    } else {
      // For new products, use addProduct
      const form = new FormData();
      form.append("name", formData.name);
      form.append("fullPrice", formData.fullPrice);
      form.append("halfPrice", formData.halfPrice);
      form.append("stock", formData.stock);
      form.append("category", formData.category);
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
  }
};


  // === HANDLE EDIT ===
  const handleEdit = (product: any) => {
    setEditingProduct(product._id);
    setFormData({
      name: product.name,
      fullPrice: product.fullPrice.toString(),
      halfPrice: product.halfPrice.toString(),
      stock: product.stock.toString(),
      category: product.category || "Tahir Fruit Chaat",
      barcode: product.barcode || "",
      imageUrl: product.imageUrl || "",
      imageFile: null,
    });
    setIsOpen(true);
  };

  // === HANDLE DELETE ===
  const handleDelete = (id: string) => {
    deleteProduct(id);
    toast({ title: "Product deleted successfully" });
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

              {/* === FULL & HALF PLATE PRICE === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {/* === STOCK === */}
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  required
                />
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

              {/* === IMAGE UPLOAD === */}
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
                        setFormData({ ...formData, imageUrl: "", imageFile: null })
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
              >
                {editingProduct ? "Update Product" : "Add Product"}
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
                <TableHead className="font-semibold text-black">Name</TableHead>
                <TableHead>Full Plate Price</TableHead>
                <TableHead>Half Plate Price</TableHead>
                <TableHead>Stock</TableHead>
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
                  <TableCell className="text-primary font-semibold">
                    {product.fullPrice} PKR
                  </TableCell>
                  <TableCell className="text-primary font-semibold">
                    {product.halfPrice} PKR
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
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
                      >
                        <Trash2 className="h-4 w-4" />
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
