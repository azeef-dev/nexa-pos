import { create } from "zustand";

export const useSalesStore = create((set) => ({
    sales: [],

    addSale: (sale) =>
        set((state) => ({
            sales: [{ id: `s${Date.now()}`, date: new Date().toISOString(), ...sale }, ...state.sales],
        })),
}));