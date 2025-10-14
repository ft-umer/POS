"use client";

import { useEffect, useState } from "react";
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
import { Download, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// PDF libraries
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ import autoTable separately



const Sales = () => {
    useEffect(() => {
    // Force reload on first mount (not on re-render)
    if (performance.navigation.type !== performance.navigation.TYPE_RELOAD) {
      window.location.reload();
    }
  }, []);
  const { sales, deleteSale, updateSale, orderTakers, products } = usePOS();
  const { toast } = useToast();

  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [deletingSale, setDeletingSale] = useState<any | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // number of rows per page

  const totalPages = Math.ceil(sales.length / itemsPerPage);

  const paginatedSales = sales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [selectedDate, setSelectedDate] = useState<string>(""); // for PDF


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

    updateSale(editingSale.id, editingSale);
    toast({ title: "Sale Updated", description: "Changes saved successfully." });
    setEditingSale(null);
  };

  const handleDeleteConfirm = () => {
    deleteSale(deletingSale.id);
    toast({ title: "Sale Deleted", description: "Sale removed successfully." });
    setDeletingSale(null);
  };

  const getSalesByDate = (dateStr: string) => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      const saleYMD = saleDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
      return saleYMD === dateStr;
    });
  };


  const downloadSalesPDF = (dateStr: string) => {
    const salesOfDay = getSalesByDate(dateStr);

    if (!salesOfDay.length) {
      toast({ title: "No Sales", description: "No sales recorded for this date." });
      return;
    }

    const doc = new jsPDF();
    const imgWidth = 35;
    const imgHeight = 35;

    doc.addImage(
      "https://res.cloudinary.com/dtipim18j/image/upload/v1760371396/logo_rnsgxs.png",
      "PNG",
      14,
      10,
      imgWidth,
      imgHeight
    );

    doc.setFontSize(16);
    doc.text(`Sales Report - ${new Date(dateStr).toLocaleDateString()}`, 14 + imgWidth + 10, 20);
    doc.setFontSize(12);

    // === Group sales by order taker ===
    const salesByTaker: Record<string, typeof salesOfDay> = {};
    salesOfDay.forEach((sale) => {
      if (!salesByTaker[sale.orderTaker]) salesByTaker[sale.orderTaker] = [];
      salesByTaker[sale.orderTaker].push(sale);
    });

    let currentY = 30 + imgHeight;

    for (const [taker, takerSales] of Object.entries(salesByTaker)) {
      doc.setFontSize(14);
      doc.text(`Order Taker: ${taker}`, 14, currentY);
      currentY += 6;

      const tableData = takerSales.map((sale) => [
        formatDate(sale.date),
        sale.orderType,
        sale.items
          .map((it: any) =>
            it.plateType
              ? `${it.name} (${it.plateType} × ${it.quantity})`
              : `${it.name} (${it.quantity})`
          )
          .join(", "),
        sale.paymentMethod,
        sale.total.toFixed(2),
      ]);

      autoTable(doc, {
        head: [["Date", "Type", "Items", "Payment", "Total (PKR)"]],
        body: tableData,
        startY: currentY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [253, 186, 116] },
        theme: "grid",
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;

      const takerRevenue = takerSales.reduce((sum, sale) => sum + sale.total, 0);
      doc.setFontSize(12);
      doc.text(`Total Revenue for ${taker}: ${takerRevenue.toFixed(2)} PKR`, 14, currentY);
      currentY += 10;
    }

    const totalRevenue = salesOfDay.reduce((sum, sale) => sum + sale.total, 0);
    doc.setFontSize(14);
    doc.text(`Overall Total Revenue: ${totalRevenue.toFixed(2)} PKR`, 14, currentY);

    doc.save(`Sales_Report_${dateStr}.pdf`);
    toast({ title: "PDF Downloaded", description: "Sales report downloaded successfully." });
  };


  return (
    <div className="space-y-6 sm:space-y-8 bg-white text-gray-900">
      {/* === PDF Download Section === */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Download Sales by Day</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44"
          />
          <Button
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => downloadSalesPDF(selectedDate)}
          >
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </CardContent>
      </Card>
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

              // === Local state for filters & pagination ===
              const [orderTypeFilter, setOrderTypeFilter] = useState("All");
              const [paymentFilter, setPaymentFilter] = useState("All");
              const [currentPage, setCurrentPage] = useState(1);
              const itemsPerPage = 5;

              // === Apply filters ===
              const filteredSales = takerSales.filter((sale) => {
                const matchesOrderType =
                  orderTypeFilter === "All" || sale.orderType === orderTypeFilter;
                const matchesPayment =
                  paymentFilter === "All" || sale.paymentMethod === paymentFilter;
                return matchesOrderType && matchesPayment;
              });

              // === Pagination logic ===
              const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const paginatedSales = filteredSales.slice(
                startIndex,
                startIndex + itemsPerPage
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

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                    <div className="flex gap-2">
                      <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Types</SelectItem>
                          <SelectItem value="Dine In">Dine In</SelectItem>
                          <SelectItem value="Take Away">Take Away</SelectItem>
                          <SelectItem value="Drive Thru">Drive Thru</SelectItem>
                          <SelectItem value="Delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Filter by Payment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Payments</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-gray-500">
                      Showing {startIndex + 1}–
                      {Math.min(startIndex + itemsPerPage, filteredSales.length)} of{" "}
                      {filteredSales.length}
                    </div>
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
                      {filteredSales.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No orders match filters
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
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedSales.map((sale) => (
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
                                      .map((item) =>
                                        item.plateType
                                          ? `${item.name} (${item.plateType} × ${item.quantity})`
                                          : `${item.name} (${item.quantity})`
                                      )
                                      .join(", ")}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-orange-100 text-orange-700 border-none">
                                      {sale.paymentMethod}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    Rs. {sale.total?.toLocaleString()}
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

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                          >
                            Next
                          </Button>
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
            <>
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
                    {paginatedSales.map((sale) => (
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
                            .map((item) =>
                              item?.plateType
                                ? `${item?.name} (${item?.plateType} × ${item?.quantity})`
                                : `${item?.name} (${item?.quantity})`
                            )
                            .join(", ")}
                        </TableCell>


                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-700 border-none">
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-black">
                          Rs. {sale.total?.toLocaleString()}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>

                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      className={`${currentPage === i + 1
                        ? "bg-orange-500 text-white"
                        : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                        }`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ==== Edit Dialog ==== */}
      <Dialog open={!!editingSale} onOpenChange={() => setEditingSale(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-orange-600">
              Edit Sale
            </DialogTitle>
          </DialogHeader>

          {editingSale && (
            <>
              {/* Scrollable content section */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {/* === Order Taker === */}
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

                {/* === Order Type === */}
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

                {/* === Payment Method === */}
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select
                    value={editingSale.paymentMethod}
                    onValueChange={(v) =>
                      setEditingSale({ ...editingSale, paymentMethod: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* === Items Section (Scrollable if too many products) === */}
                <div>
                  <label className="text-sm font-medium block mb-2">Items</label>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {editingSale.items.map((item: any, i: number) => {
                      const plateEligibleKeywords = [
                        "biryani",
                        "karahi",
                        "rice",
                        "bbq",
                        "meal",
                      ];
                      const isEligible = plateEligibleKeywords.some((kw) =>
                        item.name?.toLowerCase().includes(kw)
                      );

                      return (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                        >
                          {/* Product Info */}
                          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                            <img
                              src={item.imageUrl || "/placeholder.png"}
                              alt={item.name}
                              className="w-12 h-12 rounded-md object-cover border"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800 truncate">
                                {item.name}
                              </span>
                              {isEligible && item.plateType && (
                                <span className="text-xs text-gray-500">
                                  Plate: {item.plateType}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Plate Selector (only for eligible items) */}
                          {isEligible && (
                            <Select
                              value={item.plateType || "Full Plate"}
                              onValueChange={(v) => {
                                const newItems = [...editingSale.items];
                                newItems[i].plateType = v;

                                // Recalculate total
                                const newTotal = newItems.reduce((acc, it) => {
                                  let itemPrice = it.price || 0;
                                  if (it.plateType === "Half Plate") itemPrice /= 2;
                                  return acc + itemPrice * (it.quantity || 1);
                                }, 0);

                                setEditingSale({ ...editingSale, items: newItems, total: newTotal });
                              }}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select Plate" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Half Plate">Half Plate</SelectItem>
                                <SelectItem value="Full Plate">Full Plate</SelectItem>
                              </SelectContent>
                            </Select>

                          )}

                          {/* Quantity Input */}
                          <Input
                            type="number"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => {
                              const newItems = [...editingSale.items];
                              newItems[i].quantity = Number(e.target.value);

                              // ✅ Recalculate total price
                              const newTotal = newItems.reduce(
                                (acc, it) => acc + (it.price || 0) * (it.quantity || 1),
                                0
                              );

                              setEditingSale({ ...editingSale, items: newItems, total: newTotal });
                            }}
                            className="w-20 text-center"
                          />


                          {/* Change Product Dropdown */}
                          <select
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...editingSale.items];
                              const selectedProduct = products.find(
                                (p) => p.name === e.target.value
                              );
                              if (selectedProduct) {
                                const plateEligible = ["biryani", "karahi", "rice", "bbq", "meal"].some(
                                  (kw) => selectedProduct.name?.toLowerCase().includes(kw)
                                );

                                newItems[i] = {
                                  ...selectedProduct,
                                  quantity: newItems[i].quantity || 1,
                                  plateType: plateEligible ? "Full Plate" : undefined,
                                };

                                const newTotal = newItems.reduce((acc, it) => {
                                  let itemPrice = it.price || 0;

                                  // ✅ Halve price if Half Plate selected
                                  if (it.plateType === "Half Plate") {
                                    itemPrice = itemPrice / 2;
                                  }

                                  return acc + itemPrice * (it.quantity || 1);
                                }, 0);


                                setEditingSale({ ...editingSale, items: newItems, total: newTotal });

                              }
                            }}
                            className="border rounded-md p-2 text-sm bg-white cursor-pointer"
                          >
                            <option value={item.name}>{item.name}</option>
                            {products
                              .filter((p) => p.name !== item.name)
                              .map((product) => (
                                <option key={product._id} value={product.name}>
                                  {product.name}
                                </option>
                              ))}
                          </select>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => {
                              const newItems = editingSale.items.filter((_, index) => index !== i);
                              setEditingSale({
                                ...editingSale,
                                items: newItems,
                                total: newItems.reduce(
                                  (acc, it) => acc + (it.price || 0) * (it.quantity || 1),
                                  0
                                ),
                              });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>

                        </div>
                      );
                    })}


                  </div>

                  {/* Add New Product Button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const firstProduct = products[0];
                        const plateEligibleKeywords = [
                          "biryani",
                          "karahi",
                          "rice",
                          "bbq",
                          "meal",
                        ];
                        const isEligible = plateEligibleKeywords.some((kw) =>
                          firstProduct.name?.toLowerCase().includes(kw)
                        );

                        const newItems = [
                          ...editingSale.items,
                          {
                            name: firstProduct.name,
                            imageUrl: firstProduct.imageUrl,
                            price: firstProduct.price,
                            quantity: 1,
                            plateType: isEligible ? "Full Plate" : undefined,
                          },
                        ];

                        // ✅ Recalculate total automatically
                        const newTotal = newItems.reduce(
                          (acc, it) => acc + (it.price || 0) * (it.quantity || 1),
                          0
                        );

                        setEditingSale({ ...editingSale, items: newItems, total: newTotal });
                      }}

                      className="text-orange-600 text-sm font-medium hover:underline"
                    >
                      + Add another product
                    </button>
                  </div>


                </div>
              </div>

              <DialogFooter className="mt-4 border-t pt-3 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">
                  کل رقم:{" "}
                  <span className="text-orange-600 font-semibold">
                    Rs.{" "}
                    {editingSale.items
                      .reduce((acc, it) => {
                        let itemPrice = it.price || 0;

                        // ✅ Half Plate adjustment
                        if (it.plateType === "Half Plate") {
                          itemPrice = itemPrice / 2;
                        }

                        return acc + itemPrice * (it.quantity || 1);
                      }, 0)
                      .toLocaleString()}
                  </span>
                </div>


                <Button
                  onClick={handleEditSave}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Save Changes
                </Button>
              </DialogFooter>

            </>
          )}
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
