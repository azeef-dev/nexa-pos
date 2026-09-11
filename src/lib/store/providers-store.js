import { create } from "zustand";

export const useProvidersStore = create((set) => ({
    providers: [],

    addProvider: (provider) =>
        set((state) => ({
            providers: [...state.providers, { id: `pr${Date.now()}`, status: "Active", ...provider }],
        })),

    toggleStatus: (id) =>
        set((state) => ({
            providers: state.providers.map((p) =>
                p.id === id ? { ...p, status: p.status === "Active" ? "Suspended" : "Active" } : p
            ),
        })),

    removeProvider: (id) =>
        set((state) => ({ providers: state.providers.filter((p) => p.id !== id) })),
}));