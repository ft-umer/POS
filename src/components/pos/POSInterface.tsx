"use client";

import { useState } from "react";
import { usePOS, OrderType } from "@/contexts/POSContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Plus, Minus, Printer, CheckCircle, XCircle, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const POSInterface = () => {
  const {
    products,
    cart,
    orderTakers,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    completeSale,
  } = usePOS();

  const [searchTerm, setSearchTerm] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("Dine In");
  const [orderTaker, setOrderTaker] = useState<string>(orderTakers[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [invoiceNumber, setInvoiceNumber] = useState<number>(
    Math.floor(Math.random() * 1000000)
  );
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedPlate, setSelectedPlate] = useState("Full Plate");
  const { toast } = useToast();

  const orderTypes: OrderType[] = ["Dine In", "Take Away", "Drive Thru", "Delivery"];
  const paymentMethods = ["Cash", "Online Payment"];

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ✅ Get the current order taker object
  const currentTaker = orderTakers.find((t) => t.id === orderTaker);
  const handlePrintBill = () => {
    if (!currentTaker) {
      toast({
        title: "Select Order Taker",
        description: "Please choose an order taker before completing sale.",

      });
      return;
    }

    if (currentTaker.balance <= 0) {
      toast({
        title: "Insufficient Balance",
        description: `${currentTaker.name} cannot take more orders.`,
        variant: "error",

      });
      return;
    }

    if (currentTaker.balance < cartTotal) {
      toast({
        title: "Low Balance",
        description: `Not enough balance (${currentTaker.balance.toFixed(2)} Rs) for ${currentTaker.name} to complete this order.`,
      });
      return;
    }

    // 🧾 Prepare sale data
    const date = new Date().toLocaleString();
    const total = cartTotal.toFixed(2);
    const invoiceId = "INV-" + invoiceNumber.toString().padStart(3, "0");


    // ✅ Complete the POS sale (clear cart, etc)
    completeSale(paymentMethod, orderType, orderTaker);

    // 🖨️ Print Bill (same logic)
    const itemsHTML = cart
      .map(
        (item) => `
        <tr>
          <td style="text-align:left;">${item.name} ${item.plateType ? `(${item.plateType})` : ""
          }</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const printContent = `
    <html>
      <head>
        <title>${invoiceId}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: 58mm;
            margin: 0 auto;
            padding: 10px;
            text-align: center;
          }
          h2, h3 { margin: 0; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
          }
          td { padding: 2px 0; }
          .separator { border-top: 1px dashed #000; margin: 8px 0; }
          .total { font-weight: bold; }
          .footer { margin-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
      <img src="https://res.cloudinary.com/dtipim18j/image/upload/v1760371396/logo_rnsgxs.png"
      alt="Logo" style="width:90px; height:auto; margin-bottom:10px;" />
        <h2>Tahir Fruit Chaat</h2>
        <p>${date}</p>
        <div class="separator"></div>
        <h3>INVOICE</h3>
        <p><b>${invoiceId}</b></p>
        <div class="separator"></div>
        <table>
          <thead>
            <tr><td><b>Item</b></td><td><b>Qty</b></td><td><b>Amount</b></td></tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div class="separator"></div>
        <table>
          <tr><td colspan="2" class="total">Total</td><td class="total">${total} PKR</td></tr>
        </table>
        <div class="separator"></div>
        <p>Order Type: ${orderType}</p>
        <p>Order Taker: ${currentTaker.name}</p>
        <p>Payment: ${paymentMethod}</p>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Visit Again!</p>
        </div>
      </body>
    </html>
  `;

    const newWindow = window.open("", "_blank", "width=400,height=600");
    newWindow.document.write(printContent);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();

    setInvoiceNumber(Math.floor(Math.random() * 1000000));

    toast({
      title: "Sale Completed",
      description: `${paymentMethod} | ${orderType} | Total: ${total} PKR. Balance Left: ${currentTaker.balance - cartTotal
        } Rs.`,
    });
  };

  const handleSelectPayment = (method: string) => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to cart before choosing payment method",
        variant: "destructive",
      });
      return;
    }

    setPaymentMethod(method);

  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 bg-white text-black">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border border-gray-200 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">
              <div>
                <Label className="text-lg semi-bold">Order Type</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {orderTypes.map((type) => (
                    <Button
                      key={type}
                      variant={orderType === type ? "default" : "outline"}
                      className={`w-full text-xs ${orderType === type
                        ? "bg-[#ff6600] text-white"
                        : "border-gray-300 text-black hover:border-[#ff6600]"
                        }`}
                      onClick={() => setOrderType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-lg font-semibold">Products</Label>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:ring-[#ff6600] focus:border-[#ff6600]"
              />
            </div>

            <ScrollArea className="h-[420px] md:h-[500px]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <Card
                      key={product._id}
                      className={`cursor-pointer border rounded-xl transition-all ${isOutOfStock
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-[#ff6600] hover:shadow-lg"
                        }`}
                      onClick={() => {
                        if (isOutOfStock) return; // ❌ Prevent adding to cart if out of stock

                        const plateEligibleKeywords = [
                          "biryani",
                          "karahi",
                          "rice",
                          "bbq",
                          "meal",
                        ];
                        const isEligible = plateEligibleKeywords.some((kw) =>
                          product.name?.toLowerCase().includes(kw)
                        );

                        if (isEligible) {
                          setSelectedProduct(product);
                          setSelectedPlate("Full Plate");
                        } else {
                          addToCart(product);
                        }
                      }}
                    >
                      {product.imageUrl && (
                        <div className="aspect-square overflow-hidden rounded-t-xl relative">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform ${!isOutOfStock && "hover:scale-105"
                              }`}
                          />
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-red-600 font-bold text-sm">
                              Out of Stock
                            </div>
                          )}
                        </div>
                      )}

                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm truncate text-black">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500">Tahir Fruit Chaat</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-bold text-[#ff6600]">{product.price} PKR</span>
                          <span
                            className={`text-xs ${isOutOfStock ? "text-red-500" : "text-gray-500"
                              }`}
                          >
                            Stock: {product.stock}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="space-y-4">
        <Card className="border border-gray-200 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Type */}
            {/* <div>
              <Label>Order Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {orderTypes.map((type) => (
                  <Button
                    key={type}
                    variant={orderType === type ? "default" : "outline"}
                    className={`w-full text-xs ${orderType === type
                      ? "bg-[#ff6600] text-white"
                      : "border-gray-300 text-black hover:border-[#ff6600]"
                      }`}
                    onClick={() => setOrderType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div> */}

            {/* Order Taker */}
            <div>
              <Label>Order Taker</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
                {orderTakers.map((taker) => {
                  const isSelected = orderTaker === taker.id;
                  const isDisabled = taker.balance <= 0;

                  return (
                    <div
                      key={taker.id}
                      onClick={() => !isDisabled && setOrderTaker(taker.id)}
                      className={`
                            relative flex flex-col items-center justify-center p-4
                            rounded-2xl border-[2px] backdrop-blur-md transition-all duration-300
                            cursor-pointer overflow-hidden
                            ${isSelected
                          ? "border-[#ff6600] bg-white/60 shadow-xl scale-[1.03]"
                          : "border-transparent bg-white/30 hover:bg-white/50 hover:shadow-md"
                        }
                            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
                    >
                      {/* Image */}

                      <User

                        className="w-10 h-10 rounded-xl object-cover mb-3 border border-[#ff6600]/40"
                      />

                      {/* Name & Balance */}
                      <div className="text-center">
                        <h3 className="text-sm text-gray-800">
                          {taker.name}
                        </h3>
                        <p
                          className={`text-sm ${taker.balance > 0 ? "text-green-600" : "text-red-500"
                            }`}
                        >
                          Balance: Rs. {taker.balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );



                })}

              </div>

            </div>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card className="border border-gray-200 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">
              Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] md:h-[400px] mb-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  Cart is empty
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const isOutOfStock = item.quantity >= item.stock;


                    return (
                      <div
                        key={item._id}
                        className={`relative p-4 mb-3 rounded-2xl border-[1.5px] backdrop-blur-md transition-all`}
                      >
                        {/* Header Row */}
                        <div className="flex gap-3 items-start">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-xl border border-[#ff6600]/30"
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate flex items-center gap-2">
                              {item.name}
                              {isOutOfStock && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                  Out of Stock
                                </span>
                              )}

                            </p>
                            <p className="text-sm text-gray-500">
                              {item.price} PKR × {item.quantity}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={item.quantity <= 1}
                            onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
                            className="border-gray-300 hover:border-[#ff6600] hover:bg-[#ff6600]/10"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="w-10 text-center font-semibold text-gray-800">
                            {item.quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="icon"
                            disabled={isOutOfStock}
                            onClick={() => updateCartQuantity(item._id, item.quantity + 1)}

                            className="border-gray-300 hover:border-[#ff6600] hover:bg-[#ff6600]/10"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>

                          <span className="ml-auto font-semibold text-[#ff6600]">
                            {(item.price * item.quantity).toFixed(2)} PKR
                          </span>
                        </div>

                        <Separator className="my-3" />
                      </div>
                    );
                  })}

                </div>
              )}
            </ScrollArea>

            {/* Payment */}
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method}
                    disabled={cart.length === 0}
                    onClick={() => handleSelectPayment(method)}
                    className={`w-full text-xs ${paymentMethod === method
                      ? "bg-[#ff6600] text-white"
                      : "border-gray-300 text-black hover:border-[#ff6600]"
                      }`}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            <Button
              className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white transition"
              onClick={handlePrintBill}
              disabled={cart.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" /> Complete Sale & Print Bill
            </Button>

            <div className="flex justify-between mt-3 text-lg font-bold text-black">
              <span>Total:</span>
              <span className="text-[#ff6600]">{cartTotal.toFixed(2)} PKR</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plate Type Dialog */}
      {selectedProduct && (
        <Dialog
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
        >
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-black">Select Plate Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="font-medium text-black">{selectedProduct.name}</p>
              <p className="text-sm text-gray-500">{selectedProduct.category}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-semibold text-[#ff6600]">
                  {selectedPlate === "Half Plate"
                    ? (selectedProduct.price / 2).toFixed(2)
                    : selectedProduct.price.toFixed(2)}{" "}
                  PKR
                </span>
              </div>
              <div className="flex gap-3 mt-3">
                {["Full Plate", "Half Plate"].map((type) => (
                  <Button
                    key={type}
                    variant={selectedPlate === type ? "default" : "outline"}
                    className={`flex-1 ${selectedPlate === type
                        ? "bg-[#ff6600] text-white"
                        : "border-gray-300 text-black hover:border-[#ff6600]"
                      }`}
                    onClick={() => {
                      const price =
                        type === "Half Plate" ? selectedProduct.price / 2 : selectedProduct.price;
                      const finalProduct = {
                        ...selectedProduct,
                        price,
                        plateType: type,
                      };
                      addToCart(finalProduct);
                      setSelectedProduct(null);
                      setSelectedPlate("Full Plate"); // reset dialog
                    }}
                  >
                    {type}
                  </Button>
                ))}
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default POSInterface;
