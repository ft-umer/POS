"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { usePOS } from "@/contexts/POSContext";

const OrderTakers = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTaker, setEditingTaker] = useState<string | null>(null);
  const { orderTakers, addOrderTaker, updateOrderTaker, deleteOrderTaker } = usePOS();

  const [formData, setFormData] = useState({
    name: "",
    balance: 0,
    isSelf: false, // ✅ new field
  });

  const resetForm = () => {
    setFormData({ name: "", balance: 0, isSelf: false });
    setEditingTaker(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const takerData = {
      ...formData,
      balance: formData.isSelf ? 0 : Number(formData.balance) || 0,
    };

    if (editingTaker) {
      updateOrderTaker(editingTaker, takerData);
      toast({ title: "Order taker updated successfully" });
    } else {
      addOrderTaker(takerData);
      toast({ title: "Order taker added successfully" });
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (taker: any) => {
    setEditingTaker(taker.id);
    setFormData({
      name: taker.name,
      balance: taker.balance ?? 0,
      isSelf: taker.isSelf ?? false,
    });
    setIsOpen(true);
  };
  
  // State
const [loading, setLoading] = useState<string | null>(null);

// === HANDLE DELETE ===
const handleDelete = async (takerId: string) => {
  try {
    setLoading(takerId); // show loader only for the specific product

    await  deleteOrderTaker(takerId);
    toast({
      title: "OrderTaker deleted successfully",
      variant: "success",
    });
  } catch (err) {
    console.error("Error deleting OrderTaker:", err);
    toast({
      title: "Delete failed",
      description: "Something went wrong while deleting the product.",
      variant: "destructive",
    });
  } finally {
    setLoading(null); // reset loader
  }
};

  return (
    <Card className="bg-background border border-border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-b border-border pb-3">
        <CardTitle className="text-xl sm:text-2xl font-semibold text-text">
          Order Takers Management
        </CardTitle>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary hover:bg-hover text-white font-medium shadow-md transition">
              <Plus className="h-4 w-4 mr-2" />
              Add Order Taker
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-[95vw] sm:max-w-[400px] bg-white rounded-2xl shadow-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-text">
                {editingTaker ? "Edit Order Taker" : "Add New Order Taker"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-text">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="border-border focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* ✅ Self Order Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isSelf"
                  checked={formData.isSelf}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isSelf: !!checked })
                  }
                />
                <Label htmlFor="isSelf" className="text-sm font-medium text-text">
                  Customer taking order by self
                </Label>
              </div>

              {/* Balance — only show if name is not "Customer" */}
              {formData.name.toLowerCase() !== "open sale" && (
                <div className="space-y-2">
                  <Label htmlFor="balance" className="text-sm font-medium text-text">
                    Balance (Rs.)
                  </Label>
                  <Input
                    id="balance"
                    type="number"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({ ...formData, balance: Number(e.target.value) })
                    }
                    min={0}
                    className="border-border focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}


              <Button
                type="submit"
                className="w-full bg-primary hover:bg-hover text-white font-medium mt-2"
              >
                {editingTaker ? "Update" : "Add"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      {/* Table Content */}
      <CardContent className="p-4 sm:p-6">
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-orange-100">
              <TableRow>
                <TableHead className="text-text font-semibold">Name</TableHead>
                <TableHead className="text-text font-semibold">Balance / Type</TableHead>
                <TableHead className="text-text font-semibold text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderTakers.length > 0 ? (
                [...orderTakers]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((taker) => (
                    <TableRow
                      key={taker.id}
                      className={`hover:bg-orange-50 transition ${taker.isSelf ? "bg-blue-50" : ""
                        }`}
                    >
                      <TableCell className="font-medium text-text">
                        {taker.name}
                      </TableCell>
                      <TableCell className="text-green-700 font-semibold">
                        {taker.isSelf
                          ? "Self Order"
                          : `Rs. ${(taker.balance ?? 0).toLocaleString()}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(taker)}
                            className="text-primary hover:bg-orange-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(taker.id)}
                            disabled={loading === taker.id} // disable while deleting
                          >
                            {loading === taker.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted">
                    No order takers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderTakers;
