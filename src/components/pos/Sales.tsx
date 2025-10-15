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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Sales = () => {
  const { sales, deleteSale, orderTakers, reloadSales } = usePOS();
  const { toast } = useToast();

  useEffect(() => {
    reloadSales(); // Refresh sales every time the page is visited
  }, []);
  const [selectedDate, setSelectedDate] = useState("");
  const [allSalesPage, setAllSalesPage] = useState(1);
  const itemsPerPage = 5;

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

  const handlePrintSale = (sale: any) => {
    const invoiceId = "INV-" + sale.id.toString().padStart(6, "0");
    const date = new Date(sale.date).toLocaleString();

    const itemsHTML = sale.items
      .map(
        (item: any) => `
      <tr>
        <td style="text-align:left;">${item.name} ${item.plateType ? `(${item.plateType})` : ""}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">${(item.selectedPrice * item.quantity).toFixed(2)}</td>
      </tr>`
      )
      .join("");

    const printContent = `
    <html>
      <head>
        <title>${invoiceId}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 58mm; margin: 0 auto; padding: 10px; text-align: center; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          td { padding: 2px 0; }
          .separator { border-top: 1px dashed #000; margin: 8px 0; }
          .total { font-weight: bold; }
        </style>
      </head>
      <body>
        <img src="https://res.cloudinary.com/dtipim18j/image/upload/v1760371396/logo_rnsgxs.png" style="width:90px; margin-bottom:10px;" />
        <h2>Tahir Fruit Chaat</h2>
        <p>${date}</p>
        <div class="separator"></div>
        <h3>INVOICE</h3>
        <p><b>${invoiceId}</b></p>
        <div class="separator"></div>
        <table>
          <thead>
            <tr><td>Item</td><td>Qty</td><td>Amount</td></tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div class="separator"></div>
        <p>Total: ${sale.total.toFixed(2)} PKR</p>
        <p>Order Type: ${sale.orderType}</p>
        <p>Order Taker: ${sale.orderTaker}</p>
        <p>Payment: ${sale.paymentMethod}</p>
      </body>
    </html>
  `;

    const newWindow = window.open("", "_blank", "width=400,height=600");
    newWindow?.document.write(printContent);
    newWindow?.document.close();
    newWindow?.focus();
    newWindow?.print();
  };


  const getSalesByDate = (dateStr: string) =>
    sales.filter((sale) => sale.date.split("T")[0] === dateStr);

  const getItemDisplay = (items: any[]) =>
    items.map((it) => `${it.name} (${it.plateType} × ${it.quantity})`).join(", ");

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
        getItemDisplay(sale.items),
        sale.paymentMethod,
        sale.total,
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

  if (!orderTakers || orderTakers.length === 0 || !sales) {
    return <p className="text-center py-10 text-gray-500">Loading sales...</p>;
  }

  // Paginate All Sales
  const totalAllPages = Math.ceil(sales.length / itemsPerPage) || 1;
  const allSalesPaginated = sales.slice(
    (allSalesPage - 1) * itemsPerPage,
    allSalesPage * itemsPerPage
  );



  return (
    <div className="space-y-6 sm:space-y-8 bg-white text-gray-900">
      {/* PDF Download Section */}
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card className="shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">{sales.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">{todaySales.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalRevenue.toFixed(2)} PKR</div>
            <p className="text-sm text-gray-500 mt-1">Today: {todayRevenue.toFixed(2)} PKR</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Order Taker */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">Sales by Order Taker</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-5">
          <Tabs defaultValue={orderTakers[0]?.name} className="w-full">
            <div className="overflow-x-auto px-4 sm:px-0">
              <TabsList
                className="inline-flex w-auto min-w-full sm:grid sm:w-full border border-gray-200 bg-gray-50 rounded-lg"
                style={{ gridTemplateColumns: `repeat(${orderTakers.length}, 1fr)` }}
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
              const takerRevenue = takerSales.reduce((sum, sale) => sum + sale.total, 0);

              const [orderTypeFilter, setOrderTypeFilter] = useState("All");
              const [paymentFilter, setPaymentFilter] = useState("All");
              const [tabPage, setTabPage] = useState(1);

              const filteredSales = takerSales.filter((sale) => {
                const matchesOrderType = orderTypeFilter === "All" || sale.orderType === orderTypeFilter;
                const matchesPayment = paymentFilter === "All" || sale.paymentMethod === paymentFilter;
                return matchesOrderType && matchesPayment;
              });

              const totalTabPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
              const paginatedTabSales = filteredSales.slice((tabPage - 1) * itemsPerPage, tabPage * itemsPerPage);

              return (
                <TabsContent key={taker.id} value={taker.name} className="space-y-5 px-4 sm:px-0 mt-5">
                  {/* Order Type Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(orderTypeStats).map(([type, data]) => (
                      <Card key={type} className="border border-orange-100 hover:shadow-md transition">
                        <CardContent className="pt-4">
                          <div className="text-xs font-medium text-gray-500">{type}</div>
                          <div className="text-2xl font-semibold text-black">{data.count}</div>
                          <div className="text-sm text-gray-500 truncate">{data.revenue.toFixed(2)} PKR</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                    <div className="flex gap-2">
                      <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Types</SelectItem>
                          <SelectItem value="Dine In">Dine In</SelectItem>
                          <SelectItem value="Take Away">Take Away</SelectItem>
                          <SelectItem value="Drive Thru">Drive Thru</SelectItem>
                          <SelectItem value="Delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by Payment" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Payments</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-gray-500">
                      Showing {(tabPage - 1) * itemsPerPage + 1}–{Math.min(tabPage * itemsPerPage, filteredSales.length)} of {filteredSales.length}
                    </div>
                  </div>

                  {/* Orders Table */}
                  <Card className="border border-gray-100">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-800">
                        {taker.name}'s Orders — <span className="text-orange-600 font-bold">{takerRevenue.toFixed(2)} PKR</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-5">
                      {filteredSales.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">No orders match filters</div>
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
                              {paginatedTabSales.map((sale) => (
                                <TableRow key={sale.id} className="hover:bg-orange-50/30 transition">
                                  <TableCell className="whitespace-nowrap text-sm text-gray-600">{formatDate(sale.date)}</TableCell>
                                  <TableCell><Badge variant="outline" className="border-orange-200 text-orange-600">{sale.orderType}</Badge></TableCell>
                                  <TableCell className="text-sm text-gray-700 max-w-xs truncate">{getItemDisplay(sale.items)}</TableCell>
                                  <TableCell><Badge className="bg-orange-100 text-orange-700 border-none">{sale.paymentMethod}</Badge></TableCell>
                                  <TableCell>Rs. {sale.total?.toLocaleString()}</TableCell>
                                  <TableCell className="flex justify-center gap-2">
                                 
                                   
                                    
                                    <Button size="icon" variant="ghost" onClick={() => handlePrintSale(sale)}>
                                      🖨️
                                    </Button>
                                     <Button size="icon" variant="ghost" onClick={() => {
                                      deleteSale(sale.id);
                                      toast({ title: "Sale Deleted", description: "Sale removed successfully." });
                                    }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Pagination */}
                      {totalTabPages > 1 && (
                        <div className="flex justify-between items-center mt-4 px-4">
                          <Button variant="outline" size="sm" disabled={tabPage === 1} onClick={() => setTabPage(tabPage - 1)}>Previous</Button>
                          <span className="text-sm text-gray-500">Page {tabPage} of {totalTabPages}</span>
                          <Button variant="outline" size="sm" disabled={tabPage === totalTabPages} onClick={() => setTabPage(tabPage + 1)}>Next</Button>
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

      {/* All Sales History */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">All Sales History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-5">
          {sales.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No sales recorded yet</div>
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
                    {allSalesPaginated.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-orange-50/30">
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(sale.date)}</TableCell>
                        <TableCell className="font-medium text-gray-800">{sale.orderTaker}</TableCell>
                        <TableCell><Badge variant="outline" className="border-orange-200 text-orange-600">{sale.orderType}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-700 max-w-xs truncate">{getItemDisplay(sale.items)}</TableCell>
                        <TableCell><Badge className="bg-orange-100 text-orange-700 border-none">{sale.paymentMethod}</Badge></TableCell>
                        <TableCell className="text-right font-semibold text-black">Rs. {sale.total?.toLocaleString()}</TableCell>
                        <TableCell className="flex justify-center gap-2">
                         
                         
                          <Button size="icon" variant="ghost" onClick={() => handlePrintSale(sale)}>
                            🖨️
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => {
                            deleteSale(sale.id);
                            toast({ title: "Sale Deleted", description: "Sale removed successfully." });
                          }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalAllPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button variant="outline" size="sm" disabled={allSalesPage === 1} onClick={() => setAllSalesPage(allSalesPage - 1)}>Previous</Button>
                  {[...Array(totalAllPages)].map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      className={`${allSalesPage === i + 1 ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-700 hover:bg-orange-100"}`}
                      onClick={() => setAllSalesPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={allSalesPage === totalAllPages} onClick={() => setAllSalesPage(allSalesPage + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
