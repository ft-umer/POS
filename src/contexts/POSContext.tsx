"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { toast } from "@/components/ui/sonner";

// ======================
// Interfaces
// ======================
export interface Product {
  _id?: string;
  name: string;
  fullPrice: number;
  halfPrice: number;
  stock: number;
  barcode?: string;
  imageUrl?: string;
}


export type OrderType = "Dine In" | "Take Away" | "Drive Thru" | "Delivery";

export interface CartItem extends Product {
  quantity: number;
  selectedPrice: number; // either fullPrice or halfPrice
  plateType: "Full Plate" | "Half Plate";
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: string;
  orderType: OrderType;
  orderTaker: string;
}

export interface OrderTaker {
  id: string;
  name: string;
  phone?: string;
  balance: number;
  imageUrl?: string;
}

// ======================
// Context Type
// ======================
interface POSContextType {
  products: Product[];
  cart: CartItem[];
  sales: Sale[];
  orderTakers: OrderTaker[];

  addProduct: (formData: FormData) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  reloadProducts: () => Promise<void>;
  reloadSales: () => Promise<void>;

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  tahirPinActive: boolean;
  setTahirPinActive: React.Dispatch<React.SetStateAction<boolean>>;
  customTotal: number | null;
  setCustomTotal: React.Dispatch<React.SetStateAction<number | null>>;

  completeSale: (paymentMethod: string, orderType: OrderType, orderTakerId: string) => void;
  updateSale: (saleId: string, updatedData: Partial<Sale>) => void;
  deleteSale: (saleId: string) => void;
  deleteAllSales: () => void; // ✅ added here

  addOrderTaker: (taker: Omit<OrderTaker, "id">) => void;
  updateOrderTaker: (id: string, taker: Partial<OrderTaker>) => void;
  deleteOrderTaker: (id: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// ======================
// Provider
// ======================
export const POSProvider = ({ children }: { children: ReactNode }) => {
  // 🧠 Dynamically detect backend URL
  const BASE_URL = "https://pos-backend-kappa.vercel.app"; // Change as needed

  const PRODUCTS_URL = `${BASE_URL}/products`;
  const SALES_URL = `${BASE_URL}/sales`;
  const ORDERTAKERS_URL = `${BASE_URL}/orderTakers`;
  // --------------------
  // States
  // --------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem("pos_sales");
    return saved ? JSON.parse(saved) : [];


  });



  const [orderTakers, setOrderTakers] = useState<OrderTaker[]>([]);

  useEffect(() => {
    const fetchOrderTakers = async () => {
      try {
        const res = await axios.get(`${ORDERTAKERS_URL}`);

        // Normalize
        const formatted = res.data.map((taker: any) => ({
          id: taker._id,
          name: taker.name,
          phone: taker.phone || "",
          balance: taker.balance || 0,
          imageUrl: taker.imageUrl || "",
        }));

        // ✅ DO NOT filter Tahir Sb here — keep all in DB and localStorage
        setOrderTakers(formatted);
        localStorage.setItem("pos_orderTakers", JSON.stringify(formatted));
      } catch (err) {
        console.error("Error fetching order takers:", err);

        // ✅ fallback to localStorage if offline
        const saved = localStorage.getItem("pos_orderTakers");
        if (saved) setOrderTakers(JSON.parse(saved));
      }
    };

    fetchOrderTakers();
  }, []);



  // 🔒 Safe axios wrapper
  const safeRequest = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (err) {
      console.warn("⚠️ Offline mode or API error:", err);
      return null;
    }
  };

  // ============================
  // Product Fetch (Online + Offline)
  // ============================
  const reloadProducts = async () => {
    const res = await safeRequest(() => axios.get(PRODUCTS_URL));
    if (res && res.data) {
      setProducts(res.data);
      localStorage.setItem("pos_products", JSON.stringify(res.data));
    } else {
      const saved = localStorage.getItem("pos_products");
      if (saved) setProducts(JSON.parse(saved));
    }
  };

  useEffect(() => {
    reloadProducts();
  }, []);


  // ============================
  // Sales Fetch (Online + Offline)
  // ============================
  const reloadSales = async () => {
    const res = await safeRequest(() => axios.get(SALES_URL));

    if (res && res.data) {
      const mappedSales = res.data.map((sale: any) => ({
        id: sale._id,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        orderType: sale.orderType,
        orderTaker: sale.orderTaker,
        date: sale.createdAt,
        items: sale.items.map((item: any) => {
          const product = item.productId;

          // Infer plate type automatically from price
          let plateType = "Full Plate";
          if (item.price === product?.halfPrice) plateType = "Half Plate";

          return {
            productId: product?._id || item.productId,
            name: product?.name || "Unknown Product",
            selectedPrice: item.price,
            plateType,
            quantity: item.quantity,
            imageUrl: product?.imageUrl,
            fullPrice: product?.fullPrice,
            halfPrice: product?.halfPrice,
          };
        }),
      }));

      setSales(mappedSales);
      localStorage.setItem("pos_sales", JSON.stringify(mappedSales));
    } else {
      const saved = localStorage.getItem("pos_sales");
      if (saved) setSales(JSON.parse(saved));
    }
  };


  // 🔄 Load sales when app starts
  useEffect(() => {
    reloadSales();
  }, []);


  // ============================
  // Product CRUD
  // ============================
  const addProduct = async (formData: FormData) => {
    const res = await safeRequest(() =>
      axios.post(PRODUCTS_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
    if (res && res.data) {
      const updated = [res.data, ...products];
      setProducts(updated);
      localStorage.setItem("pos_products", JSON.stringify(updated));
    }
  };


  const updateProduct = async (id: string, product: Partial<Product>) => {
    const res = await safeRequest(() => axios.put(`${PRODUCTS_URL}/${id}`, product));
    if (res && res.data) {
      const updated = products.map((p) => (p._id === id ? res.data : p));
      setProducts(updated);
      localStorage.setItem("pos_products", JSON.stringify(updated));
    }
  };

  const deleteProduct = async (id: string) => {
    const res = await safeRequest(() => axios.delete(`${PRODUCTS_URL}/${id}`));
    if (res !== null) {
      const updated = products.filter((p) => p._id !== id);
      setProducts(updated);
      localStorage.setItem("pos_products", JSON.stringify(updated));
    }
  };

  // ============================
const addToCart = (product: Product, plateType?: "Full Plate" | "Half Plate") => {
  const finalPlateType = product.isSolo ? "Full Plate" : plateType || "Full Plate";
  const selectedPrice = finalPlateType === "Full Plate" ? product.fullPrice : product.halfPrice;

  setCart((prev) => {
    const existing = prev.find(
      (item) => item._id === product._id && item.plateType === finalPlateType
    );

    if (existing) {
      return prev.map((item) =>
        item._id === product._id && item.plateType === finalPlateType
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [
      ...prev,
      {
        ...product,
        quantity: 1,
        selectedPrice,
        plateType: finalPlateType,
        fullStock: product.fullStock,
        halfStock: product.halfStock,
      },
    ];
  });
};



  const removeFromCart = (_id: string, plateType: "Full Plate" | "Half Plate") => {
    setCart(prev => prev.filter(item => !(item._id === _id && item.plateType === plateType)));
  };


  const updateCartQuantity = (_id: string, plateType: "Full Plate" | "Half Plate", quantity: number) => {
    setCart(prev =>
      prev.map(item =>
        item._id === _id && item.plateType === plateType ? { ...item, quantity } : item
      )
    );
  };



  const clearCart = () => setCart([]);
  // ✅ Add these at the top-level (GLOBAL state)
  const [tahirPinActive, setTahirPinActive] = useState(false);
  const [customTotal, setCustomTotal] = useState<number | null>(null);


// ============================
// Complete Sale (Online + Offline)
// ============================
const completeSale = async (
  paymentMethod: string,
  orderType: OrderType,
  orderTakerId: string
) => {
  // if (!cart.length) return toast({ title: "Cart is empty", variant: "destructive" });

  // 1️⃣ Calculate normal total
  let normalTotal = cart.reduce((sum, item) => sum + item.selectedPrice * item.quantity, 0);

  // 2️⃣ Identify order taker
  const taker = orderTakers.find((t) => t.id === orderTakerId);
  const isCustomer = !taker || taker.name.toLowerCase() === "open sale";
  const isTahirMode = tahirPinActive && taker?.name.toLowerCase().includes("tahir sb");

  // 3️⃣ Effective total (0 if Tahir Sb mode active)
  const total = isTahirMode ? 0 : normalTotal;

  // 4️⃣ Check balance for normal takers
  if (!isCustomer && !isTahirMode && (taker!.balance < total)) {
    return toast({
      title: "Insufficient Balance",
      description: `${taker!.name} has only ${taker!.balance.toFixed(2)} Rs available.`,
      variant: "destructive",
    });
  }

  // 5️⃣ Build sale payload
  const salePayload = {
    items: cart.map((item) => ({
      productId: item._id,
      quantity: item.quantity,
      price: item.selectedPrice,
      plateType: item.plateType,
    })),
    total,
    paymentMethod,
    orderType,
    orderTaker: isCustomer ? "Open Sale" : taker!.name,
  };

  // 6️⃣ Save sale online or offline
  let saleSaved: Sale;
  const res = await safeRequest(() => axios.post(SALES_URL, salePayload));

  if (res?.data) {
    saleSaved = { ...res.data, id: res.data._id, date: res.data.createdAt };
    // toast({ title: "✅ Sale completed successfully (Online)." });
  } else {
    saleSaved = {
      id: Date.now().toString(),
      items: cart,
      total,
      date: new Date().toISOString(),
      paymentMethod,
      orderType,
      orderTaker: isCustomer ? "Open Sale" : taker?.name || "Open Sale",
    };
    // toast({ title: "✅ Sale saved offline (will sync later)." });
  }

  // 7️⃣ Update sales state & localStorage
  setSales((prev) => [saleSaved, ...prev]);
  localStorage.setItem("pos_sales", JSON.stringify([saleSaved, ...sales]));

 // 8️⃣ Update taker balance (skip Customer & Tahir Sb)
if (!isCustomer && !isTahirMode && taker) {
  const newBalance = (taker.balance || 0) - total;

  setOrderTakers((prev) =>
    prev.map((t) =>
      t.id === taker.id ? { ...t, balance: newBalance } : t
    )
  );

  safeRequest(() =>
    axios.put(`${ORDERTAKERS_URL}/${taker.id}`, { balance: newBalance })
  ).catch((err) =>
    console.warn("⚠️ Could not update order taker balance in DB:", err)
  );
}


  // 9️⃣ Update product stock
  setProducts((prev) =>
    prev.map((p) => {
      const soldItems = cart.filter((c) => c._id === p._id);
      if (!soldItems.length) return p;

      let fullSold = 0;
      let halfSold = 0;

      soldItems.forEach((item) => {
        if (item.plateType === "Full Plate") fullSold += item.quantity;
        if (item.plateType === "Half Plate") halfSold += item.quantity;
      });

      const updatedProduct = {
        ...p,
        fullStock: (p.fullStock || 0) - fullSold,
        halfStock: (p.halfStock || 0) - halfSold,
        totalStock: ((p.fullStock || 0) - fullSold) + ((p.halfStock || 0) - halfSold),
      };

      safeRequest(() =>
        axios.put(`${PRODUCTS_URL}/${p._id}`, {
          fullStock: updatedProduct.fullStock,
          halfStock: updatedProduct.halfStock,
          totalStock: updatedProduct.totalStock,
        })
      );

      return updatedProduct;
    })
  );

  // 1️⃣0️⃣ Clear cart & reset Tahir Sb mode
  clearCart();
  setTahirPinActive(false);
  setCustomTotal(null);
};

// ============================
// Delete All Sales (Online + Offline)
// ============================
const deleteAllSales = async () => {
  // Try online first
  await safeRequest(() => axios.delete(`${SALES_URL}/all`)); // assumes backend endpoint exists
  // Reset local state
  setSales([]);
  localStorage.setItem("pos_sales", JSON.stringify([]));

  // Reset order taker balances (refund all sales)
  setOrderTakers(prev =>
    prev.map(taker => {
      // Sum all sales by this taker
      const takerSalesTotal = sales
        .filter(s => s.orderTaker === taker.name)
        .reduce((sum, s) => sum + s.total, 0);
      return { ...taker, balance: taker.balance + takerSalesTotal };
    })
  );

  toast("All sales records have been removed successfully.");
};



  // ============================
  // Update & Delete Sale (Online + Offline)
  // ============================
  const updateSale = async (saleId: string, updatedData: Partial<Sale>) => {
    const res = await safeRequest(() => axios.put(`${SALES_URL}/${saleId}`, updatedData));
    const updatedSales = sales.map((s) =>
      s.id === saleId ? { ...s, ...(res?.data || updatedData) } : s
    );
    setSales(updatedSales);
    localStorage.setItem("pos_sales", JSON.stringify(updatedSales));
  };

  const deleteSale = async (saleId: string) => {
    await safeRequest(() => axios.delete(`${SALES_URL}/${saleId}`));
    const saleToDelete = sales.find((s) => s.id === saleId);
    const updatedSales = sales.filter((s) => s.id !== saleId);
    setSales(updatedSales);
    localStorage.setItem("pos_sales", JSON.stringify(updatedSales));
    if (saleToDelete) {
      setOrderTakers((prev) =>
        prev.map((t) =>
          t.name === saleToDelete.orderTaker
            ? { ...t, balance: t.balance + saleToDelete.total }
            : t
        )
      );
    }
  };

  // Add Order Taker
  const addOrderTaker = async (taker: Omit<OrderTaker, "id">) => {
    const newTaker: OrderTaker = { ...taker, id: Date.now().toString() };

    // Try online
    const res = await safeRequest(() => axios.post(ORDERTAKERS_URL, taker));
    if (res && res.data) {
      newTaker.id = res.data._id;
      setOrderTakers(prev => [...prev, newTaker]);
      localStorage.setItem("pos_orderTakers", JSON.stringify([...orderTakers, newTaker]));
      return;
    }

    // Offline fallback
    setOrderTakers(prev => [...prev, newTaker]);
    localStorage.setItem("pos_orderTakers", JSON.stringify([...orderTakers, newTaker]));
  };


  // Update Order Taker
  const updateOrderTaker = async (id: string, updated: Partial<OrderTaker>) => {
    // Try online
    const res = await safeRequest(() => axios.put(`${ORDERTAKERS_URL}/${id}`, updated));
    const updatedTakers = orderTakers.map(t => t.id === id ? { ...t, ...(res?.data || updated) } : t);

    setOrderTakers(updatedTakers);
    localStorage.setItem("pos_orderTakers", JSON.stringify(updatedTakers));
  };


  // Delete Order Taker
  const deleteOrderTaker = async (id: string) => {
    // Try online
    await safeRequest(() => axios.delete(`${ORDERTAKERS_URL}/${id}`));

    const updated = orderTakers.filter(t => t.id !== id);
    setOrderTakers(updated);
    localStorage.setItem("pos_orderTakers", JSON.stringify(updated));
  };
  // ============================
  // Return
  // ============================
  return (
    <POSContext.Provider
      value={{
        products,
        cart,
        sales,
        orderTakers,
        addProduct,
        updateProduct,
        deleteProduct,
        reloadProducts,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        deleteAllSales,
        clearCart,
        completeSale,
        updateSale,
        deleteSale,
        addOrderTaker,
        updateOrderTaker,
        deleteOrderTaker,
        reloadSales,
        tahirPinActive,       // ✅ expose these
        setTahirPinActive,    // ✅
        customTotal,          // ✅
        setCustomTotal,       // ✅
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

// ======================
// Hook
// ======================
export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) throw new Error("usePOS must be used within POSProvider");
  return context;
};
