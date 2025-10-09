import { usePOS, OrderType } from '@/contexts/POSContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const Sales = () => {
  const { sales, orderTakers } = usePOS();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
      'Dine In': { count: 0, revenue: 0 },
      'Take Away': { count: 0, revenue: 0 },
      'Drive Thru': { count: 0, revenue: 0 },
      Delivery: { count: 0, revenue: 0 },
    };
    orderTakerSales.forEach((sale) => {
      stats[sale.orderType].count++;
      stats[sale.orderType].revenue += sale.total;
    });
    return stats;
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
            <div className="text-3xl font-bold text-black">
              {sales.length}
            </div>
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
                        {taker.name}'s Orders —{' '}
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
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {takerSales.map((sale) => (
                                <TableRow key={sale.id} className="hover:bg-orange-50/30">
                                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                                    {formatDate(sale.date)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="border-orange-200 text-orange-600">
                                      {sale.orderType}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-700 max-w-xs truncate">
                                    {sale.items
                                      .map(
                                        (item) =>
                                          `${item.name} (${item.quantity})`
                                      )
                                      .join(', ')}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        sale.paymentMethod === 'Cash'
                                          ? 'default'
                                          : 'secondary'
                                      }
                                      className="bg-orange-100 text-orange-700 border-none"
                                    >
                                      {sale.paymentMethod}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-black">
                                    {sale.total.toFixed(2)} PKR
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
                        <Badge variant="outline" className="border-orange-200 text-orange-600">
                          {sale.orderType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 max-w-xs truncate">
                        {sale.items
                          .map((item) => `${item.name} (${item.quantity})`)
                          .join(', ')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.paymentMethod === 'Cash'
                              ? 'default'
                              : 'secondary'
                          }
                          className="bg-orange-100 text-orange-700 border-none"
                        >
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-black">
                        {sale.total.toFixed(2)} PKR
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
