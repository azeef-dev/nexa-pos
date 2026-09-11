import { create } from "zustand";

export const useCartStore = create((set, get) => ({
    items: [],

    addItem: (product) =>
        set((state) => {
            const existing = state.items.find((i) => i.id === product.id);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.id === product.id ? { ...i, qty: i.qty + 1 } : i
                    ),
                };
            }
            return { items: [...state.items, { ...product, qty: 1 }] };
        }),

    incrementItem: (id) =>
        set((state) => ({
            items: state.items.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)),
        })),

    decrementItem: (id) =>
        set((state) => ({
            items: state.items
                .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
                .filter((i) => i.qty > 0),
        })),

    removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

    clearCart: () => set({ items: [] }),

    getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));