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
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <CardTitle className="text-xl sm:text-2xl">Order Takers Management</CardTitle>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Order Taker
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-[95vw] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editingTaker ? "Edit Order Taker" : "Add New Order Taker"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                {editingTaker ? "Update" : "Add"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderTakers.map((taker) => (
                <TableRow key={taker.id}>
                  <TableCell>{taker.name}</TableCell>
                  <TableCell>{taker.phone}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(taker)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(taker.id)}
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

export default OrderTakers;
