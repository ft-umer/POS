import { usePOS, OrderType } from '@/contexts/POSContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Sales = () => {
  const { sales, orderTakers } = usePOS();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.date).toDateString();
    const today = new Date().toDateString();
    return saleDate === today;
  });
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  const getSalesByOrderTaker = (orderTaker: string) => {
    return sales.filter(sale => sale.orderTaker === orderTaker);
  };

  const getOrderTypeStats = (orderTakerSales: typeof sales) => {
    const stats: Record<OrderType, { count: number; revenue: number }> = {
      'Dine In': { count: 0, revenue: 0 },
      'Take Away': { count: 0, revenue: 0 },
      'Drive Thru': { count: 0, revenue: 0 },
      'Delivery': { count: 0, revenue: 0 },
    };

    orderTakerSales.forEach(sale => {
      stats[sale.orderType].count++;
      stats[sale.orderType].revenue += sale.total;
    });

    return stats;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{todaySales.length}</div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{totalRevenue.toFixed(2)} PKR</div>
            <p className="text-sm text-muted-foreground mt-1">
              Today: {todayRevenue.toFixed(2)} PKR
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Order Taker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Sales by Order Taker</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Tabs defaultValue={orderTakers[0]} className="w-full">
            <div className="overflow-x-auto px-4 sm:px-0">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full" style={{ gridTemplateColumns: `repeat(${orderTakers.length}, 1fr)` }}>
                {orderTakers.map((taker) => (
                  <TabsTrigger key={taker} value={taker} className="whitespace-nowrap px-4 sm:px-6">
                    {taker}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {orderTakers.map((taker) => {
              const takerSales = getSalesByOrderTaker(taker);
              const orderTypeStats = getOrderTypeStats(takerSales);
              const takerRevenue = takerSales.reduce((sum, sale) => sum + sale.total, 0);

              return (
                <TabsContent key={taker} value={taker} className="space-y-4 px-4 sm:px-0 mt-4">
                  {/* Order Type Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground">Dine In</div>
                        <div className="text-xl sm:text-2xl font-bold">{orderTypeStats['Dine In'].count}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {orderTypeStats['Dine In'].revenue.toFixed(2)} PKR
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground">Take Away</div>
                        <div className="text-xl sm:text-2xl font-bold">{orderTypeStats['Take Away'].count}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {orderTypeStats['Take Away'].revenue.toFixed(2)} PKR
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground">Drive Thru</div>
                        <div className="text-xl sm:text-2xl font-bold">{orderTypeStats['Drive Thru'].count}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {orderTypeStats['Drive Thru'].revenue.toFixed(2)} PKR
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground">Delivery</div>
                        <div className="text-xl sm:text-2xl font-bold">{orderTypeStats['Delivery'].count}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {orderTypeStats['Delivery'].revenue.toFixed(2)} PKR
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Orders Table/Cards */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">
                        {taker}'s Orders - Total: {takerRevenue.toFixed(2)} PKR
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6">
                      {takerSales.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          No orders yet
                        </div>
                      ) : (
                        <>
                          {/* Mobile Card View */}
                          <div className="block lg:hidden space-y-3 p-4">
                            {takerSales.map((sale) => (
                              <Card key={sale.id} className="overflow-hidden">
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(sale.date)}
                                    </div>
                                    <Badge variant="outline" className="text-xs">{sale.orderType}</Badge>
                                  </div>
                                  <div className="text-sm font-medium">
                                    {sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <Badge variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'} className="text-xs">
                                      {sale.paymentMethod}
                                    </Badge>
                                    <div className="text-base font-bold text-primary">
                                      {sale.total.toFixed(2)} PKR
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {/* Desktop Table View */}
                          <div className="hidden lg:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Items</TableHead>
                                  <TableHead>Payment</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {takerSales.map((sale) => (
                                  <TableRow key={sale.id}>
                                    <TableCell className="text-sm whitespace-nowrap">{formatDate(sale.date)}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{sale.orderType}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm max-w-xs truncate">
                                      {sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'}>
                                        {sale.paymentMethod}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold whitespace-nowrap">
                                      {sale.total.toFixed(2)} PKR
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Sales History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {sales.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No sales recorded yet
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3 p-4">
                {sales.map((sale) => (
                  <Card key={sale.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(sale.date)}
                          </div>
                          <div className="font-medium text-sm mt-1">{sale.orderTaker}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">{sale.orderType}</Badge>
                      </div>
                      <div className="text-sm">
                        {sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'} className="text-xs">
                          {sale.paymentMethod}
                        </Badge>
                        <div className="text-base font-bold text-primary">
                          {sale.total.toFixed(2)} PKR
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order Taker</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-sm whitespace-nowrap">{formatDate(sale.date)}</TableCell>
                        <TableCell className="font-medium">{sale.orderTaker}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.orderType}</Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'}>
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          {sale.total.toFixed(2)} PKR
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
