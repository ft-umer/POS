import { useState } from 'react';
import { usePOS, OrderType } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, Printer } from 'lucide-react';

const POSInterface = () => {
  const { products, cart, orderTakers, addToCart, removeFromCart, updateCartQuantity, completeSale } = usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('Dine In');
  const [orderTaker, setOrderTaker] = useState(orderTakers[0]);
  const { toast } = useToast();

  const orderTypes: OrderType[] = ['Dine In', 'Take Away', 'Drive Thru', 'Delivery'];

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCompleteSale = (method: string) => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to cart before completing sale',
        variant: 'destructive',
      });
      return;
    }

    completeSale(method, orderType, orderTaker);
    toast({
      title: 'Sale completed',
      description: `Total: ${cartTotal.toFixed(2)} PKR | ${orderType} | ${orderTaker}`,
    });
  };
  
  const handlePrintBill = () => {
  if (cart.length === 0) {
    toast({
      title: "Cart is empty",
      description: "Add items to cart before printing",
      variant: "destructive",
    });
    return;
  }

  const date = new Date().toLocaleString();
  const total = cartTotal.toFixed(2);

  // Generate HTML for cart items
  const itemsHTML = cart
    .map(
      (item) => `
        <tr>
          <td style="text-align:left;">${item.name}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">${(item.price * item.quantity).toFixed(
            2
          )}</td>
        </tr>
      `
    )
    .join("");

  // Receipt HTML
  const printContent = `
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: 58mm;
            margin: 0 auto;
            padding: 10px;
            text-align: center;
          }
          h2, h3 {
            margin: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
          }
          td {
            padding: 2px 0;
          }
          .separator {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .total {
            font-weight: bold;
          }
          .footer {
            margin-top: 10px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <h2>ACME INDUSTRIES</h2>
        <p>${date}</p>
        <div class="separator"></div>
        <h3>RECEIPT</h3>
        <div class="separator"></div>
        <table>
          <thead>
            <tr>
              <td><b>Item</b></td>
              <td><b>Qty</b></td>
              <td><b>Amount</b></td>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        <div class="separator"></div>
        <table>
          <tr>
            <td colspan="2" class="total">Total</td>
            <td class="total">${total} PKR</td>
          </tr>
        </table>
        <div class="separator"></div>
        <p>Order Type: ${orderType}</p>
        <p>Handled by: ${orderTaker}</p>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Powered by AXIS POS</p>
        </div>
      </body>
    </html>
  `;

  const newWindow = window.open("", "_blank", "width=400,height=600");
  newWindow.document.write(printContent);
  newWindow.document.close();
  newWindow.focus();
  newWindow.print();
};


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[400px] md:h-[500px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
                    onClick={() => addToCart(product)}
                  >
                    {product.imageUrl && (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardContent className="p-3 md:p-4">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">{product.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2">{product.category}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-lg font-bold">{product.price} PKR</span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                          Stock: {product.stock}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Order Type</Label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {orderTypes.map((type) => (
                  <Button
                    key={type}
                    variant={orderType === type ? "default" : "outline"}
                    className="w-full text-xs sm:text-sm"
                    onClick={() => setOrderType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Order Taker</Label>
              <Select value={orderTaker} onValueChange={setOrderTaker}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orderTakers.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] md:h-[400px] mb-4">
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Cart is empty
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex gap-3 items-start">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.price} PKR × {item.quantity}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="ml-auto font-semibold">
                          {(item.price * item.quantity).toFixed(2)} PKR
                        </span>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="space-y-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{cartTotal.toFixed(2)} PKR</span>
              </div>
              <Separator />
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                <Button
                  className="w-full"
                  onClick={() => handleCompleteSale('Cash')}
                  disabled={cart.length === 0}
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Cash
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => handleCompleteSale('Card')}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Card
                </Button>
              </div>
              <Button
                className="w-full"

                onClick={handlePrintBill}
                disabled={cart.length === 0}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POSInterface;
