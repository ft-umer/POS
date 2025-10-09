"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { usePOS } from "@/contexts/POSContext";

const OrderTakers = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTaker, setEditingTaker] = useState<string | null>(null);
  const { orderTakers, addOrderTaker, updateOrderTaker, deleteOrderTaker } = usePOS();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const resetForm = () => {
    setFormData({ name: "", phone: "" });
    setEditingTaker(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTaker) {
      updateOrderTaker(editingTaker, formData);
      toast({ title: "Order taker updated successfully" });
    } else {
      addOrderTaker(formData);
      toast({ title: "Order taker added successfully" });
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (taker: any) => {
    setEditingTaker(taker.id);
    setFormData({
      name: taker.name,
      phone: taker.phone,
    });
    setIsOpen(true);
  };

  const handleDelete = (takerId: string) => {
    deleteOrderTaker(takerId);
    toast({ title: "Order taker deleted successfully" });
  };

  return (
    <Card className="bg-background border border-border shadow-sm">
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-b border-border pb-3">
        <CardTitle className="text-xl sm:text-2xl font-semibold text-text">
          Order Takers Management
        </CardTitle>

        {/* Dialog Trigger */}
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
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-text">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-border focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-text">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="border-border focus:ring-2 focus:ring-primary"
                />
              </div>

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
                <TableHead className="text-text font-semibold">Phone</TableHead>
                <TableHead className="text-text font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderTakers.length > 0 ? (
                orderTakers.map((taker) => (
                  <TableRow
                    key={taker.id}
                    className="hover:bg-orange-50 transition"
                  >
                    <TableCell className="font-medium text-text">{taker.name}</TableCell>
                    <TableCell className="text-muted">{taker.phone}</TableCell>
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
                          className="text-black hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted">
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
