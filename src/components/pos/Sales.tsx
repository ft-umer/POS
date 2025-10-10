"use client";

import { useState } from "react";
import { usePOS, OrderType } from "@/contexts/POSContext";
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
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Sales = () => {
  const { sales, setSales, orderTakers } = usePOS();
  const { toast } = useToast();

  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [deletingSale, setDeletingSale] = useState<any | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const todaySales = sales.filter(
    (sale) => new Date(sale.date).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  const getSalesByOrderTaker = (orderTaker: string) =>
    sales.filter((sale) => sale.orderTaker === orderTaker);

  const getOrderTypeStats = (orderTakerSales: typeof sales) => {
    const stats: Record<OrderType, { count: number; revenue: number }> = {
      "Dine In": { count: 0, revenue: 0 },
      "Take Away": { count: 0, revenue: 0 },
      "Drive Thru": { count: 0, revenue: 0 },
      Delivery: { count: 0, revenue: 0 },
    };
    orderTakerSales.forEach((sale) => {
      stats[sale.orderType].count++;
      stats[sale.orderType].revenue += sale.total;
    });
    return stats;
  };

  const handleEditSave = () => {
    const updatedSales = sales.map((s) =>
      s.id === editingSale.id ? editingSale : s
    );
    setSales(updatedSales);
    toast({ title: "Sale Updated", description: "Changes saved successfully." });
    setEditingSale(null);
  };

  const handleDeleteConfirm = () => {
    setSales((prev) => prev.filter((s) => s.id !== deletingSale.id));
    toast({ title: "Sale Deleted", description: "Sale removed successfully." });
    setDeletingSale(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 bg-white text-gray-900">
      {/* ==== Stats Section ==== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card className="shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">{sales.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Today's Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">
              {todaySales.length}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {totalRevenue.toFixed(2)} PKR
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Today: {todayRevenue.toFixed(2)} PKR
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ==== Sales by Order Taker ==== */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
            Sales by Order Taker
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-5">
          <Tabs defaultValue={orderTakers[0]?.name} className="w-full">
            <div className="overflow-x-auto px-4 sm:px-0">
              <TabsList
                className="inline-flex w-auto min-w-full sm:grid sm:w-full border border-gray-200 bg-gray-50 rounded-lg"
                style={{
                  gridTemplateColumns: `repeat(${orderTakers.length}, 1fr)`,
                }}
              >
                {orderTakers.map((taker) => (
                  <TabsTrigger
                    key={taker.id}
                    value={taker.name}
                    className="whitespace-nowrap px-4 sm:px-6 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-600"
                  >
                    {taker.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {orderTakers.map((taker) => {
              const takerSales = getSalesByOrderTaker(taker.name);
              const orderTypeStats = getOrderTypeStats(takerSales);
              const takerRevenue = takerSales.reduce(
                (sum, sale) => sum + sale.total,
                0
              );

              return (
                <TabsContent
                  key={taker.id}
                  value={taker.name}
                  className="space-y-5 px-4 sm:px-0 mt-5"
                >
                  {/* Order Type Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(orderTypeStats).map(([type, data]) => (
                      <Card
                        key={type}
                        className="border border-orange-100 hover:shadow-md transition"
                      >
                        <CardContent className="pt-4">
                          <div className="text-xs font-medium text-gray-500">
                            {type}
                          </div>
                          <div className="text-2xl font-semibold text-black">
                            {data.count}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {data.revenue.toFixed(2)} PKR
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Orders Table */}
                  <Card className="border border-gray-100">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-800">
                        {taker.name}'s Orders —{" "}
                        <span className="text-orange-600 font-bold">
                          {takerRevenue.toFixed(2)} PKR
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-5">
                      {takerSales.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No orders yet
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-orange-100">
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">
                                  Total
                                </TableHead>
                                <TableHead className="text-center">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {takerSales.map((sale) => (
                                <TableRow
                                  key={sale.id}
                                  className="hover:bg-orange-50/30 transition"
                                >
                                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                                    {formatDate(sale.date)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="border-orange-200 text-orange-600"
                                    >
                                      {sale.orderType}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-700 max-w-xs truncate">
                                    {sale.items
                                      .map(
                                        (item) =>
                                          `${item.name} (${item.quantity})`
                                      )
                                      .join(", ")}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-orange-100 text-orange-700 border-none">
                                      {sale.paymentMethod}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-black">
                                    {sale.total.toFixed(2)} PKR
                                  </TableCell>
                                  <TableCell className="flex justify-center gap-2">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() =>
                                        setEditingSale({ ...sale })
                                      }
                                    >
                                      <Pencil className="w-4 h-4 text-orange-600" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() =>
                                        setDeletingSale(sale)
                                      }
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* ==== All Sales History ==== */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
            All Sales History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-5">
          {sales.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No sales recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-100">
                    <TableHead>Date</TableHead>
                    <TableHead>Order Taker</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-orange-50/30">
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(sale.date)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {sale.orderTaker}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-orange-200 text-orange-600"
                        >
                          {sale.orderType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 max-w-xs truncate">
                        {sale.items
                          .map((item) => `${item.name} (${item.quantity})`)
                          .join(", ")}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-700 border-none">
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-black">
                        {sale.total.toFixed(2)} PKR
                      </TableCell>
                      <TableCell className="flex justify-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingSale({ ...sale })}
                        >
                          <Pencil className="w-4 h-4 text-orange-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingSale(sale)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==== Edit Dialog ==== */}
      <Dialog open={!!editingSale} onOpenChange={() => setEditingSale(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-orange-600">
              Edit Sale
            </DialogTitle>
          </DialogHeader>
          {editingSale && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Order Taker</label>
                <Select
                  value={editingSale.orderTaker}
                  onValueChange={(v) =>
                    setEditingSale({ ...editingSale, orderTaker: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Order Taker" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderTakers.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Order Type</label>
                <Select
                  value={editingSale.orderType}
                  onValueChange={(v) =>
                    setEditingSale({ ...editingSale, orderType: v as OrderType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dine In">Dine In</SelectItem>
                    <SelectItem value="Take Away">Take Away</SelectItem>
                    <SelectItem value="Drive Thru">Drive Thru</SelectItem>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <Input
                  value={editingSale.paymentMethod}
                  onChange={(e) =>
                    setEditingSale({
                      ...editingSale,
                      paymentMethod: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Items</label>
                <div className="space-y-2">
                  {editingSale.items.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center gap-3 border p-2 rounded-md"
                    >
                      <span className="text-sm text-gray-700">
                        {item.name}
                      </span>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...editingSale.items];
                          newItems[i].quantity = Number(e.target.value);
                          setEditingSale({
                            ...editingSale,
                            items: newItems,
                          });
                        }}
                        className="w-20"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              onClick={handleEditSave}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==== Delete Confirm Dialog ==== */}
      <Dialog open={!!deletingSale} onOpenChange={() => setDeletingSale(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">
              Delete Sale
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this sale? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeletingSale(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
