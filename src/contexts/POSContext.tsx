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
  const BASE_URL = "http://localhost:5000"; // Change as needed

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
  // Cart Management
  const addToCart = (product: Product, plateType: "Full Plate" | "Half Plate") => {
    const selectedPrice = plateType === "Full Plate" ? product.fullPrice : product.halfPrice;

    setCart((prev) => {
      const existing = prev.find(item => item._id === product._id && item.plateType === plateType);
      if (existing) {
        return prev.map(item =>
          item._id === product._id && item.plateType === plateType
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedPrice, plateType }];
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
    // Normal total calculation
    let total = cart.reduce((sum, item) => sum + item.selectedPrice * item.quantity, 0);

    const taker = orderTakers.find((t) => t.id === orderTakerId);
    if (!taker) return alert("Invalid order taker selected.");

    // ✅ Enforce 0 total if Tahir Sb mode active
    if (tahirPinActive && customTotal !== null) {
      total = 0;
    }

    // ✅ Skip balance check if Tahir Sb zero mode active
    if (!tahirPinActive && taker.balance < total) {
      return alert(`${taker.name} has insufficient balance.`);
    }

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
      orderTaker: taker.name,
    };

    const res = await safeRequest(() => axios.post(SALES_URL, salePayload));

    if (res && res.data) {
      const newSale: Sale = {
        ...res.data,
        id: res.data._id,
        date: res.data.createdAt,
      };
      const updatedSales = [newSale, ...sales];
      setSales(updatedSales);
      localStorage.setItem("pos_sales", JSON.stringify(updatedSales));
      toast("✅ Sale completed successfully (Online).");
    } else {
      const offlineSale: Sale = {
        id: Date.now().toString(),
        items: cart,
        total,
        date: new Date().toISOString(),
        paymentMethod,
        orderType,
        orderTaker: taker.name,
      };
      const updatedSales = [offlineSale, ...sales];
      setSales(updatedSales);
      localStorage.setItem("pos_sales", JSON.stringify(updatedSales));
      alert("✅ Sale saved offline (will sync later).");
    }

    // ✅ Update balance both locally & in DB
    setOrderTakers((prev) =>
      prev.map((t) =>
        t.id === orderTakerId
          ? { ...t, balance: t.balance - (tahirPinActive ? 0 : total) }
          : t
      )
    );

    // ✅ Persist updated balance in backend (if not Tahir mode)
    if (!tahirPinActive) {
      try {
        const taker = orderTakers.find((t) => t.id === orderTakerId);
        if (taker) {
          await safeRequest(() =>
            axios.put(`${ORDERTAKERS_URL}/${orderTakerId}`, {
              balance: taker.balance - total,
            })
          );
        }
      } catch (err) {
        console.warn("⚠️ Could not update order taker balance in DB:", err);
      }
    }


    // ✅ Update product stock normally
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((c) => c._id === p._id);
        return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
      })
    );

    clearCart();

    // ✅ Optional: reset Tahir mode after sale
    setTahirPinActive(false);
    setCustomTotal(null);
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
