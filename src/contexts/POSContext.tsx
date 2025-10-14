"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

// ======================
// Interfaces
// ======================
export interface Product {
  _id?: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
  plateType?: string;
  imageUrl?: string;
  createdAt?: string;
}

export type OrderType = "Dine In" | "Take Away" | "Drive Thru" | "Delivery";

export interface CartItem extends Product {
  quantity: number;
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
  phone: string;
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
  const BASE_URL = "https://pos-backend-kappa.vercel.app";

  const PRODUCTS_URL = `${BASE_URL}/products`;
  const SALES_URL = `${BASE_URL}/sales`;

  // --------------------
  // States
  // --------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem("pos_sales");
    return saved ? JSON.parse(saved) : [];
  });
  const [orderTakers, setOrderTakers] = useState<OrderTaker[]>(() => {
    const saved = localStorage.getItem("pos_orderTakers");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "1", name: "Ahmad", phone: "03001234567", balance: 5000 },
          { id: "2", name: "Sara", phone: "03002345678", balance: 3000 },
          { id: "3", name: "Hassan", phone: "03003456789", balance: 7000 },
        ];
  });

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
    // 🧠 Map sales so that each item includes product name, price, etc.
    const mappedSales = res.data.map((sale: any) => ({
      id: sale._id,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      orderType: sale.orderType,
      orderTaker: sale.orderTaker,
      date: sale.createdAt,
      items: sale.items.map((item: any) => ({
        productId: item.productId?._id || item.productId,
        name: item.productId?.name || "Unknown Product",
        price: item.productId?.price || item.price,
        imageUrl: item.productId?.imageUrl,
        plateType: item.productId?.plateType,
        quantity: item.quantity,
      })),
    }));

    setSales(mappedSales);
    localStorage.setItem("pos_sales", JSON.stringify(mappedSales));
  } else {
    // Offline mode fallback
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
  // ============================
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((item) => item._id !== productId));

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  // ============================
  // Complete Sale (Online + Offline)
  // ============================
  const completeSale = async (
    paymentMethod: string,
    orderType: OrderType,
    orderTakerId: string
  ) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taker = orderTakers.find((t) => t.id === orderTakerId);

    if (!taker) return alert("Invalid order taker selected.");
    if (taker.balance < total)
      return alert(`${taker.name} has insufficient balance.`);

    const salePayload = {
      items: cart.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        price: item.price,
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
      alert("✅ Sale completed successfully (Online).");
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

    setOrderTakers((prev) =>
      prev.map((t) =>
        t.id === orderTakerId ? { ...t, balance: t.balance - total } : t
      )
    );
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((c) => c._id === p._id);
        return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
      })
    );
    clearCart();
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

  // ============================
  // Order Taker CRUD
  // ============================
  const addOrderTaker = (taker: Omit<OrderTaker, "id">) => {
    const newTaker: OrderTaker = { ...taker, id: Date.now().toString() };
    const updated = [...orderTakers, newTaker];
    setOrderTakers(updated);
    localStorage.setItem("pos_orderTakers", JSON.stringify(updated));
  };

  const updateOrderTaker = (id: string, updated: Partial<OrderTaker>) => {
    const updatedTakers = orderTakers.map((t) =>
      t.id === id ? { ...t, ...updated } : t
    );
    setOrderTakers(updatedTakers);
    localStorage.setItem("pos_orderTakers", JSON.stringify(updatedTakers));
  };

  const deleteOrderTaker = (id: string) => {
    const updated = orderTakers.filter((t) => t.id !== id);
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
