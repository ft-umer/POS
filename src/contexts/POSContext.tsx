import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import zingerBurgerImg from "@/assets/products/zinger-burger.jpg";
import chickenTikkaImg from "@/assets/products/chicken-tikka.jpg";
import biryaniImg from "@/assets/products/biryani.jpg";
import samosaImg from "@/assets/products/samosa.jpg";
import chaiImg from "@/assets/products/chai.jpg";
import coldDrinkImg from "@/assets/products/cold-drink.jpg";

// ======================
// Interfaces
// ======================
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string;
  imageUrl?: string;
  plateType?: string;
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
  orderTaker: string; // name only
}

export interface OrderTaker {
  id: string;
  name: string;
  phone: string;
  balance: number; // 💰 amount available to take orders
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
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  completeSale: (
    paymentMethod: string,
    orderType: OrderType,
    orderTaker: string
  ) => void;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addOrderTaker: (taker: Omit<OrderTaker, "id">) => void;
  updateOrderTaker: (id: string, taker: Partial<OrderTaker>) => void;
  deleteOrderTaker: (id: string) => void;
  updateSale: (saleId: string, updatedData: any) => void;
  deleteSale: (saleId: string) => void;
}


// ======================
// Default Data
// ======================
const POSContext = createContext<POSContextType | undefined>(undefined);

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Zinger Burger",
    price: 350,
    category: "Fast Food",
    stock: 50,
    barcode: "123456",
    imageUrl: zingerBurgerImg,
  },
  {
    id: "2",
    name: "Chicken Tikka",
    price: 280,
    category: "Main Course",
    stock: 30,
    barcode: "123457",
    imageUrl: chickenTikkaImg,
  },
  {
    id: "3",
    name: "Biryani",
    price: 320,
    category: "Main Course",
    stock: 40,
    barcode: "123458",
    imageUrl: biryaniImg,
  },
  {
    id: "4",
    name: "Samosa",
    price: 30,
    category: "Snacks",
    stock: 100,
    barcode: "123459",
    imageUrl: samosaImg,
  },
  {
    id: "5",
    name: "Chai",
    price: 50,
    category: "Beverages",
    stock: 200,
    barcode: "123460",
    imageUrl: chaiImg,
  },
  {
    id: "6",
    name: "Cold Drink",
    price: 80,
    category: "Beverages",
    stock: 150,
    barcode: "123461",
    imageUrl: coldDrinkImg,
  },
];

// ======================
// Provider
// ======================
export const POSProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("pos_products");
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [cart, setCart] = useState<CartItem[]>([]);

 const getSavedSales = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("pos_sales") || "[]");
  } catch {
    return [];
  }
};

const [sales, setSales] = useState<Sale[]>(getSavedSales);

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


const updateSale = (saleId: string, updatedData: Partial<Sale>) => {
  setSales((prevSales) => {
    const existingSale = prevSales.find((sale) => sale.id === saleId);
    if (!existingSale) return prevSales;

    // Create updated sale
    const updatedSale = { ...existingSale, ...updatedData };

    // Compute total difference only if total is changed
    const oldTotal = existingSale.total ?? 0;
    const newTotal = updatedSale.total ?? oldTotal;
    const totalDiff = newTotal - oldTotal;

    // If nothing changed, skip
    if (totalDiff === 0 && JSON.stringify(updatedSale) === JSON.stringify(existingSale)) {
      return prevSales;
    }

    // Update the order taker balances separately AFTER returning new sales
    setTimeout(() => {
      setOrderTakers((prevTakers) =>
        prevTakers.map((taker) =>
          taker.name === existingSale.orderTaker
            ? { ...taker, balance: taker.balance - totalDiff }
            : taker
        )
      );
    }, 0);

    // Update sales in state and localStorage
    const updatedSales = prevSales.map((sale) =>
      sale.id === saleId ? updatedSale : sale
    );

    localStorage.setItem("pos_sales", JSON.stringify(updatedSales));
    return updatedSales;
  });
};




  const deleteSale = (saleId: string) => {
    setSales((prevSales) => {
      const saleToDelete = prevSales.find((sale) => sale.id === saleId);
      if (!saleToDelete) return prevSales;

      // 💰 Refund the sale amount to the order taker
      setOrderTakers((prevTakers) =>
        prevTakers.map((taker) =>
          taker.name === saleToDelete.orderTaker
            ? { ...taker, balance: taker.balance + saleToDelete.total }
            : taker
        )
      );

      const updatedSales = prevSales.filter((sale) => sale.id !== saleId);
      localStorage.setItem("pos_sales", JSON.stringify(updatedSales));
      return updatedSales;
    });
  };


  // ======================
  // Persist data
  // ======================
  useEffect(() => {
    localStorage.setItem("pos_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("pos_sales", JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem("pos_orderTakers", JSON.stringify(orderTakers));
  }, [orderTakers]);

  // ======================
  // Cart functions
  // ======================
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  // ======================
  // Complete Sale
  // ======================
  const completeSale = (
    paymentMethod: string,
    orderType: OrderType,
    orderTakerId: string
  ) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const taker = orderTakers.find((t) => t.id === orderTakerId);
    if (!taker) {
      alert("Invalid order taker selected.");
      return;
    }

    // 🚫 Check balance
    if (taker.balance < total) {
      alert(`${taker.name} has insufficient balance to take this order.`);
      return;
    }

    // ✅ Create the sale
    const sale: Sale = {
      id: Date.now().toString(),
      items: cart,
      total,
      date: new Date().toISOString(),
      paymentMethod,
      orderType,
      orderTaker: taker.name,
    };

    setSales((prev) => [sale, ...prev]);

    // 🧮 Deduct balance from the order taker
    setOrderTakers((prev) =>
      prev.map((t) =>
        t.id === orderTakerId ? { ...t, balance: t.balance - total } : t
      )
    );

    // 📉 Update product stock
    setProducts((prev) =>
      prev.map((product) => {
        const cartItem = cart.find((item) => item.id === product.id);
        if (cartItem) {
          return { ...product, stock: product.stock - cartItem.quantity };
        }
        return product;
      })
    );

    clearCart();
  };


  // ======================
  // Product CRUD
  // ======================
  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct: Product = { ...product, id: Date.now().toString() };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ======================
  // Order Taker CRUD
  // ======================
  const addOrderTaker = (taker: Omit<OrderTaker, "id">) => {
    const newTaker: OrderTaker = { ...taker, id: Date.now().toString() };
    setOrderTakers((prev) => [...prev, newTaker]);
  };

  const updateOrderTaker = (id: string, updated: Partial<OrderTaker>) => {
    setOrderTakers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  const deleteOrderTaker = (id: string) => {
    setOrderTakers((prev) => prev.filter((t) => t.id !== id));
  };

  // ======================
  // Return Context
  // ======================
  return (
    <POSContext.Provider
      value={{
        products,
        cart,
        sales,
        orderTakers,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        completeSale,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrderTaker,
        updateOrderTaker,
        deleteOrderTaker,
        updateSale,
        deleteSale,
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
  if (!context) {
    throw new Error("usePOS must be used within POSProvider");
  }
  return context;
};
