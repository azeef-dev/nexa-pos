import { create } from "zustand";

export const useCustomersStore = create((set) => ({
    customers: [],

    addCustomer: (customer) =>
        set((state) => ({
            customers: [...state.customers, { id: `c${Date.now()}`, creditBalance: 0, ...customer }],
        })),

    removeCustomer: (id) =>
        set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })),
}));