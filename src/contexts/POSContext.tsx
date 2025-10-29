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
  selectedPrice: number;
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

  addToCart: (product: Product, plateType?: "Full Plate" | "Half Plate") => void;
  removeFromCart: (productId: string, plateType: "Full Plate" | "Half Plate") => void;
  updateCartQuantity: (productId: string, plateType: "Full Plate" | "Half Plate", quantity: number) => void;
  clearCart: () => void;

  tahirPinActive: boolean;
  setTahirPinActive: React.Dispatch<React.SetStateAction<boolean>>;
  customTotal: number | null;
  setCustomTotal: React.Dispatch<React.SetStateAction<number | null>>;

  completeSale: (paymentMethod: string, orderType: OrderType, orderTakerId: string) => void;
  updateSale: (saleId: string, updatedData: Partial<Sale>) => void;
  deleteSale: (saleId: string) => void;
  deleteAllSales: () => void;

  addOrderTaker: (taker: Omit<OrderTaker, "id">) => void;
  updateOrderTaker: (id: string, taker: Partial<OrderTaker>) => void;
  deleteOrderTaker: (id: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// ======================
// Provider
// ======================
export const POSProvider = ({ children }: { children: ReactNode }) => {
  const BASE_URL = "https://pos-backend-kappa.vercel.app";

  const PRODUCTS_URL = `${BASE_URL}/products`;
  const SALES_URL = `${BASE_URL}/sales`;
  const ORDERTAKERS_URL = `${BASE_URL}/orderTakers`;

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem("pos_sales");
    return saved ? JSON.parse(saved) : [];
  });
  const [orderTakers, setOrderTakers] = useState<OrderTaker[]>([]);
  const [tahirPinActive, setTahirPinActive] = useState(false);
  const [customTotal, setCustomTotal] = useState<number | null>(null);

  // =================================
  // Universal Safe Request (with Token)
  // =================================
  const safeRequest = async <T,>(
    method: string,
    url: string,
    data?: any,
    config: any = {}
  ): Promise<T | null> => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}`, ...config.headers } : config.headers;
      const response = await axios({ method, url, data, headers });
      return response.data;
    } catch (err) {
      console.warn("⚠️ API or Offline Error:", err);
      return null;
    }
  };

  // ============================
  // Order Takers Fetch
  // ============================
  useEffect(() => {
    const fetchOrderTakers = async () => {
      const res = await safeRequest("get", ORDERTAKERS_URL);
      if (res) {
        const formatted = res.map((taker: any) => ({
          id: taker._id,
          name: taker.name,
          phone: taker.phone || "",
          balance: taker.balance || 0,
          imageUrl: taker.imageUrl || "",
        }));
        setOrderTakers(formatted);
        localStorage.setItem("pos_orderTakers", JSON.stringify(formatted));
      } else {
        const saved = localStorage.getItem("pos_orderTakers");
        if (saved) setOrderTakers(JSON.parse(saved));
      }
    };
    fetchOrderTakers();
  }, []);

  // ============================
  // Products
  // ============================
  const reloadProducts = async () => {
    const res = await safeRequest("get", PRODUCTS_URL);
    if (res) {
      setProducts(res);
      localStorage.setItem("pos_products", JSON.stringify(res));
    } else {
      const saved = localStorage.getItem("pos_products");
      if (saved) setProducts(JSON.parse(saved));
    }
  };

  useEffect(() => {
    reloadProducts();
  }, []);

  const addProduct = async (formData: FormData) => {
    const res = await safeRequest("post", PRODUCTS_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res) {
      const updated = [res, ...products];
      setProducts(updated);
      localStorage.setItem("pos_products", JSON.stringify(updated));
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const res = await safeRequest("put", `${PRODUCTS_URL}/${id}`, product);
    if (res) {
      const updated = products.map((p) => (p._id === id ? res : p));
      setProducts(updated);
      localStorage.setItem("pos_products", JSON.stringify(updated));
    }
  };

  const deleteProduct = async (id: string) => {
    const res = await safeRequest("delete", `${PRODUCTS_URL}/${id}`);
    if (res !== null) {
      const updated = products.filter((p) => p._id !== id);
      setProducts(updated);
      localStorage.setItem("pos_products", JSON.stringify(updated));
    }
  };

  // ============================
  // Cart
  // ============================
  const addToCart = (product: Product, plateType?: "Full Plate" | "Half Plate") => {
    const finalPlateType = plateType || "Full Plate";
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

      return [...prev, { ...product, quantity: 1, selectedPrice, plateType: finalPlateType }];
    });
  };

  const removeFromCart = (_id: string, plateType: "Full Plate" | "Half Plate") => {
    setCart((prev) => prev.filter((item) => !(item._id === _id && item.plateType === plateType)));
  };

  const updateCartQuantity = (
    _id: string,
    plateType: "Full Plate" | "Half Plate",
    quantity: number
  ) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === _id && item.plateType === plateType ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  // ============================
  // Sales
  // ============================
  const reloadSales = async () => {
    const res = await safeRequest("get", SALES_URL);
    if (res) {
      const mappedSales = res.map((sale: any) => ({
        id: sale._id,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        orderType: sale.orderType,
        orderTaker: sale.orderTaker,
        date: sale.createdAt,
        items: sale.items.map((item: any) => ({
          productId: item.productId?._id || item.productId,
          name: item.productId?.name || "Unknown Product",
          selectedPrice: item.price,
          plateType: item.price === item.productId?.halfPrice ? "Half Plate" : "Full Plate",
          quantity: item.quantity,
          imageUrl: item.productId?.imageUrl,
        })),
      }));

      setSales(mappedSales);
      localStorage.setItem("pos_sales", JSON.stringify(mappedSales));
    } else {
      const saved = localStorage.getItem("pos_sales");
      if (saved) setSales(JSON.parse(saved));
    }
  };

  useEffect(() => {
    reloadSales();
  }, []);

  // ============================
  // Order Takers CRUD
  // ============================
  const addOrderTaker = async (taker: Omit<OrderTaker, "id">) => {
    const res = await safeRequest("post", ORDERTAKERS_URL, taker);
    if (res) {
      const newTaker = { ...taker, id: res._id };
      setOrderTakers((prev) => [...prev, newTaker]);
      localStorage.setItem("pos_orderTakers", JSON.stringify([...orderTakers, newTaker]));
    }
  };

  const updateOrderTaker = async (id: string, updated: Partial<OrderTaker>) => {
    const res = await safeRequest("put", `${ORDERTAKERS_URL}/${id}`, updated);
    const updatedTakers = orderTakers.map((t) => (t.id === id ? { ...t, ...(res || updated) } : t));
    setOrderTakers(updatedTakers);
    localStorage.setItem("pos_orderTakers", JSON.stringify(updatedTakers));
  };

  const deleteOrderTaker = async (id: string) => {
    await safeRequest("delete", `${ORDERTAKERS_URL}/${id}`);
    const updated = orderTakers.filter((t) => t.id !== id);
    setOrderTakers(updated);
    localStorage.setItem("pos_orderTakers", JSON.stringify(updated));
  };

  // ============================
  // Complete Sale (Fixed Token Use)
  // ============================
  const completeSale = async (
    paymentMethod: string,
    orderType: OrderType,
    orderTakerId: string
  ) => {
    let total = cart.reduce((sum, item) => sum + item.selectedPrice * item.quantity, 0);
    const taker = orderTakers.find((t) => t.id === orderTakerId);

    const salePayload = {
      items: cart.map((i) => ({
        productId: i._id,
        quantity: i.quantity,
        price: i.selectedPrice,
        plateType: i.plateType,
      })),
      total,
      paymentMethod,
      orderType,
      orderTaker: taker?.name || "Open Sale",
    };

    const res = await safeRequest("post", SALES_URL, salePayload);
    if (res) toast("✅ Sale recorded successfully");

    clearCart();
  };

  // ============================
  // Context Return
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
        updateSale: () => {},
        deleteSale: () => {},
        deleteAllSales: () => {},
        addOrderTaker,
        updateOrderTaker,
        deleteOrderTaker,
        reloadSales,
        tahirPinActive,
        setTahirPinActive,
        customTotal,
        setCustomTotal,
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
