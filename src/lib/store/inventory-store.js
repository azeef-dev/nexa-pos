import { create } from "zustand";
import { PRODUCTS } from "@/lib/data/products";

const seedItems = PRODUCTS.map((p) => ({ ...p, stock: 20 }));

export const useInventoryStore = create((set) => ({
    items: seedItems,

    addItem: (item) =>
        set((state) => ({
            items: [...state.items, { id: `p${Date.now()}`, ...item }],
        })),

    removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

    decrementStock: (id, qty) =>
        set((state) => ({
            items: state.items.map((i) =>
                i.id === id ? { ...i, stock: Math.max(0, i.stock - qty) } : i
            ),
        })),
}));