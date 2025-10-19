"use client";

import { useEffect, useState } from "react";
import { usePOS, OrderType, CartItem, Product } from "@/contexts/POSContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Plus, Minus, Printer, User } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const POSInterface = () => {
  const {
    products,
    cart,
    orderTakers,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    completeSale,
    tahirPinActive, setTahirPinActive, customTotal, setCustomTotal
  } = usePOS();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("Dine In");
  const [orderTaker, setOrderTaker] = useState<string>(orderTakers[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [invoiceNumber, setInvoiceNumber] = useState<number>(Math.floor(Math.random() * 1000000));
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<"Full Plate" | "Half Plate">("Full Plate");
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [resetLoading, setResetLoading] = useState(false);


  const orderTypes: OrderType[] = ["Dine In", "Take Away", "Drive Thru", "Delivery"];
  const paymentMethods = ["Cash", "Online Payment"];

  // Filter products
  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm)
  );




  const currentTaker = orderTakers.find((t) => t.id === orderTaker);
  const isTahirSb = currentTaker && currentTaker.name.toLowerCase().includes("tahir sb");

  const calculatedTotal = cart.reduce((sum, item) => sum + item.selectedPrice * item.quantity, 0);

  let cartTotal = calculatedTotal;

  // ✅ If Tahir Sb PIN is active → set bill 0
  if (tahirPinActive && customTotal !== null) {
    cartTotal = customTotal;
  }

  // ✅ Automatically restore normal mode when switching away
  useEffect(() => {
    if (currentTaker && !currentTaker.name.toLowerCase().includes("tahir sb")) {
      setTahirPinActive(false);
      setCustomTotal(null);
    }
  }, [currentTaker]);

  const handlePrintBill = () => {
    // Find Tahir Sb in the full orderTakers list (context now contains him).
    const tahirTaker = orderTakers.find((t) =>
      t.name.toLowerCase().includes("tahir sb")
    );

    // current selected taker (may be undefined)
    const selectedTaker = orderTakers.find((t) => t.id === orderTaker);

    // Is Tahir mode active AND is Tahir present in list?
    const isTahirMode = tahirPinActive && !!tahirTaker;

    // Choose which taker will be used for the sale
    const finalTaker = isTahirMode ? tahirTaker : selectedTaker;

    // If no taker found and NOT Tahir-mode, ask user to select one.
    if (!finalTaker) {
      // if Tahir-mode was requested but Tahir is missing, show clear error
      if (tahirPinActive && !tahirTaker) {
        return toast({
          title: "Tahir Sb missing",
          description: "Tahir Sb is not available in order takers list.",
          variant: "destructive",
        });
      }

      return toast({
        title: "Select Order Taker",
        description: "Please choose an order taker.",
        variant: "destructive",
      });
    }

    // Calculate totals
    const normalTotal = cart.reduce((sum, item) => sum + item.selectedPrice * item.quantity, 0);
    const effectiveTotal = isTahirMode ? 0 : normalTotal;

    // Balance check only when NOT Tahir-mode
    if (!isTahirMode && (finalTaker.balance ?? 0) < effectiveTotal) {
      return toast({
        title: "Insufficient Balance",
        description: `${finalTaker.name} has only ${(finalTaker.balance ?? 0).toFixed(2)} Rs available.`,
        variant: "destructive",
      });
    }

    // call completeSale with the final taker's id
    completeSale(paymentMethod, orderType, finalTaker.id);

    // build and open print window (use effectiveTotal in printed invoice)
    const invoiceId = "INV-" + invoiceNumber.toString().padStart(6, "0");
    const date = new Date().toLocaleString();

    const itemsHTML = cart.map(item => `
    <tr>
      <td style="text-align:left;">${item.name} ${item.plateType ? `(${item.plateType})` : ""}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${(item.selectedPrice * item.quantity).toFixed(2)}</td>
    </tr>`).join("");

    const printContent = `
    <html><head><title>${invoiceId}</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 58mm; margin: 0 auto; padding: 10px; text-align: center; }
        table { width: 100%; border-collapse: collapse; font-size: 17px; font-weight:bold; margin-top: 10px; }
        td { padding: 2px 0; }
        .separator { border-top: 1px dashed #000; margin: 8px 0; }
        
         .footer {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        margin-top: 6px;
      }
         p{
           font-weight: bold;
         }
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
        <thead><tr><td>Item</td><td>Qty</td><td>Amount</td></tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div class="separator"></div>
      <p>Total: ${effectiveTotal.toFixed(2)} PKR</p>
      <p>Order Type: ${orderType}</p>
      <p>Order Taker: ${finalTaker.name}</p>
      <p>Payment: ${paymentMethod}</p>
      <br />
      <div class="footer">
      <p>Powered By: <b>Egency Digital</b></p>
      <span>|</span>
      <p>Contact:</p>
      <p><b>0325 0525254</b></p>
      </div>
    </body>
    </html>
  `;

    const newWindow = window.open("", "_blank", "width=400,height=600");
    newWindow?.document.write(printContent);
    newWindow?.document.close();
    newWindow?.focus();
    newWindow?.print();

    setInvoiceNumber(Math.floor(Math.random() * 1000000));
    toast({
      title: "Sale Completed",
      description: `Total: ${effectiveTotal.toFixed(2)} PKR (${isTahirMode ? "Tahir Sb Mode" : "Normal"})`,
    });
  };


  const handleSelectPayment = (method: string) => {
    if (cart.length === 0) return toast({ title: "Cart is empty", description: "Add items before selecting payment.", variant: "destructive" });
    setPaymentMethod(method);
  };

  const handleResetSales = async () => {
    if (pinInput !== "1234") {
      toast({ title: "Invalid PIN", description: "Please enter the correct PIN.", variant: "destructive" });
      return;
    }

    setResetLoading(true);
    try {
      // Reset logic – clear sales data from backend and frontend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://pos-backend-kappa.vercel.app"}/sales/reset`, { method: "DELETE" }).catch(() => { });

      // Local fallback: clear from localStorage
      localStorage.removeItem("pos_sales");
      localStorage.removeItem("pos_cart");

      toast({ title: "Sales Reset", description: "All sales have been reset to zero." });
      window.location.reload();
    } catch (error) {
      toast({ title: "Failed to reset", description: "An error occurred while resetting.", variant: "destructive" });
    } finally {
      setResetLoading(false);
      setPinDialogOpen(false);
      setPinInput("");
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 bg-white text-black">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border border-gray-200 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">Order Type</CardTitle>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {orderTypes.map((type) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  className={`w-full text-xs ${orderType === type ? "bg-[#ff6600] text-white" : "border-gray-300 text-black hover:border-[#ff6600]"}`}
                  onClick={() => setOrderType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <Label>Products</Label>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:ring-[#ff6600] focus:border-[#ff6600]"
              />
            </div>

            <ScrollArea className="h-[420px] md:h-[500px]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const isEligibleForPlate = ["biryani", "karahi", "rice", "bbq", "meal", "chaat"].some((kw) =>
                    product.name.toLowerCase().includes(kw)
                  );

                  return (
                    <Card
                      key={product._id}
                      className={`cursor-pointer border rounded-xl transition-all ${product.stock <= 0 ? "opacity-50 cursor-not-allowed" : "hover:border-[#ff6600] hover:shadow-lg"}`}
                      onClick={() => {
                        if (product.stock <= 0) return;
                        if (isEligibleForPlate) {
                          setSelectedProduct(product);
                          setSelectedPlate("Full Plate");
                        } else {
                          addToCart({
                            ...product,
                            selectedPrice: product.fullPrice,
                            plateType: "Full Plate",
                            quantity: 1,
                          });
                        }
                      }}
                    >
                      {product.imageUrl && (
                        <div className="aspect-square overflow-hidden rounded-t-xl relative">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          {product.stock <= 0 && <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-red-600 font-bold text-sm">Out of Stock</div>}
                        </div>
                      )}
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm truncate text-black">{product.name}</h3>
                        <p className="text-xs text-gray-500">Tahir Fruit Chaat</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-bold text-[#ff6600]">{product.fullPrice} PKR</span>
                          <span className="text-xs text-gray-500">Stock: {product.stock}</span>
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
        {/* Order Takers */}
        <Card className="border border-gray-200 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Order Taker</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-5 mt-3">
              {orderTakers
                .filter(
                  (taker) =>
                    !taker.name.toLowerCase().includes("tahir sb") || tahirPinActive // show Tahir Sb when mode active
                )
                .map((taker) => (

                  <div
                    key={taker.id}
                    onClick={() => {
                      if (taker.balance > 0) {
                        setOrderTaker(taker.id);
                        if (!taker.name.toLowerCase().includes("tahir sb")) {
                          setCustomTotal(null); // restore normal total when switching away
                        }
                      }
                    }}

                    className={`relative flex flex-col items-center p-4 rounded-2xl border-[2px] cursor-pointer transition-all ${orderTaker === taker.id ? "border-[#ff6600] bg-white/60 shadow-lg" : "border-transparent bg-white/30 hover:bg-white/50"
                      } ${taker.balance <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <User className="w-10 h-10 mb-3 border border-[#ff6600]/40 rounded-xl" />
                    <div className="text-center">
                      <p className="text-sm text-gray-800">{taker.name}</p>
                      <p className={`text-sm ${taker.balance > 0 ? "text-green-600" : "text-red-500"}`}>Balance: Rs. {taker.balance}</p>
                    </div>
                  </div>
                ))}
            </div>
            <Label>Tahir Sb</Label>
            <img
              src="https://res.cloudinary.com/dtipim18j/image/upload/v1760371396/logo_rnsgxs.png"
              className="w-20 h-20 cursor-pointer hover:scale-105 transition-transform"
              alt="Tahir Sb"
              onClick={() => {
                const pin = prompt("Enter PIN to activate Tahir Sb mode:");

                if (pin === "0000786") {
                  // ✅ Find Tahir Sb from order takers
                  const tahir = orderTakers.find((t) =>
                    t.name.toLowerCase().includes("tahir sb")
                  );

                  if (tahir) {
                    setOrderTaker(tahir.id); // ✅ select Tahir Sb as active order taker
                  }

                  setCustomTotal(0); // ✅ make bill 0
                  setTahirPinActive(true); // ✅ enable zero-bill mode

                  toast({
                    title: "Tahir Sb Mode Activated",
                    description: "Order taker set to Tahir Sb and total bill set to 0 PKR.",
                    className: "bg-green-500 text-white",
                  });
                } else if (pin && pin.trim() !== "") {
                  toast({
                    title: "Incorrect PIN",
                    description: "Please enter the correct PIN to put Tahir sb's sale.",
                    className: "bg-red-500 text-white",
                  });
                  setTahirPinActive(false);
                }
              }}
            />
            {tahirPinActive && (
              <p className="text-sm text-[#ff6600] font-semibold mt-2">
                Tahir Sb (Admin Mode Active)
              </p>
            )}


          </CardContent>
        </Card>

        {/* Cart */}
        <Card className="border border-gray-200 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] md:h-[400px] mb-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Cart is empty</div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item: CartItem) => {
                    const isOutOfStock = item.quantity >= item.stock;
                    return (
                      <div key={item._id} className="p-4 mb-3 rounded-2xl border-[1.5px] backdrop-blur-md">
                        <div className="flex gap-3 items-start">
                          {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-[#ff6600]/30" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate">{item.name} {item.plateType && `(${item.plateType})`}</p>
                            <p className="text-sm text-gray-500">{item.selectedPrice} PKR × {item.quantity}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item._id, item.plateType!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="icon" disabled={item.quantity <= 1} onClick={() => updateCartQuantity(item._id, item.plateType, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                          <span className="w-10 text-center font-semibold text-gray-800">{item.quantity}</span>
                          <Button variant="outline" size="icon" disabled={isOutOfStock} onClick={() => updateCartQuantity(item._id, item.plateType, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                          <span className="ml-auto font-semibold text-[#ff6600]">{(item.selectedPrice * item.quantity).toFixed(2)} PKR</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {paymentMethods.map((method) => (
                <Button key={method} disabled={cart.length === 0} onClick={() => handleSelectPayment(method)}
                  className={`w-full text-xs ${paymentMethod === method ? "bg-[#ff6600] text-white" : "border-gray-300 text-black hover:border-[#ff6600]"}`}>
                  {method}
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            <Button className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white" onClick={handlePrintBill} disabled={cart.length === 0}>
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
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-black">Select Plate Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="font-medium text-black">{selectedProduct.name}</p>
              <div className="flex gap-3 mt-3">
                {["Full Plate", "Half Plate"].map((type) => (
                  <Button
                    key={type}
                    variant={selectedPlate === type ? "default" : "outline"}
                    className={`flex-1 ${selectedPlate === type ? "bg-[#ff6600] text-white" : "border-gray-300 text-black hover:border-[#ff6600]"}`}
                    onClick={() => {
                      if (!selectedProduct) return;

                      // ✅ Use new addToCart with plate type
                      addToCart(selectedProduct, type as "Full Plate" | "Half Plate");

                      setSelectedProduct(null);
                      setSelectedPlate("Full Plate"); // reset dialog
                    }}
                  >
                    {type} ({type === "Full Plate" ? selectedProduct.fullPrice : selectedProduct.halfPrice} PKR)
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-black">Enter PIN to Reset Sales</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm text-gray-700">PIN Code</Label>
            <Input
              type="password"
              placeholder="Enter 4-digit PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="border-gray-300 focus:border-[#ff6600]"
            />
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPinDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResetSales} disabled={resetLoading} className="bg-[#ff6600] text-white hover:bg-[#e65c00]">
              {resetLoading ? "Resetting..." : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default POSInterface;
