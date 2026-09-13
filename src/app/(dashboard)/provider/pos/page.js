"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/data/products";
import { useCartStore } from "@/lib/store/cart-store";
import { queueOfflineSale } from "@/lib/offline-db";
import ReceiptModal from "@/components/shared/ReceiptModal";
import { TAX_RATE } from "@/lib/tax";

export default function PosPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [isCredit, setIsCredit] = useState(false);
    const [businessName, setBusinessName] = useState("NexaPOS");
    const [receiptSale, setReceiptSale] = useState(null);

    const items = useCartStore((s) => s.items);
    const addItem = useCartStore((s) => s.addItem);
    const incrementItem = useCartStore((s) => s.incrementItem);
    const decrementItem = useCartStore((s) => s.decrementItem);
    const removeItem = useCartStore((s) => s.removeItem);
    const clearCart = useCartStore((s) => s.clearCart);

    async function loadProducts() {
        setLoading(true);
        try {
            const res = await fetch("/api/inventory");
            if (res.ok) setProducts(await res.json());
        } catch {
            // offline
        }
        setLoading(false);
    }

    async function loadCustomers() {
        try {
            const res = await fetch("/api/customers");
            if (res.ok) setCustomers(await res.json());
        } catch {
            // offline
        }
    }

    useEffect(() => {
        loadProducts();
        loadCustomers();
        fetch("/api/auth/me")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data && setBusinessName(data.businessName));
    }, []);

    const filteredProducts = products.filter((p) => {
        const matchesCategory = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    function handleAddToCart(product) {
        if (product.stock === 0) return;
        addItem(product);
    }

    function resetPaymentFields() {
        setIsCredit(false);
        setSelectedCustomerId("");
    }

    async function handleCheckout() {
        if (items.length === 0) return;
        if (isCredit && !selectedCustomerId) {
            toast.error("Select a customer for a credit sale");
            return;
        }

        const payload = {
            items,
            subtotal,
            tax,
            total,
            customerId: selectedCustomerId || null,
            isCredit,
        };

        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const result = await res.json();
                toast.error(result.error || "Checkout failed");
                return;
            }

            const savedSale = await res.json();
            setReceiptSale(savedSale);
            clearCart();
            resetPaymentFields();
            loadProducts();
        } catch {
            await queueOfflineSale(payload);
            setProducts((prev) =>
                prev.map((p) => {
                    const cartItem = items.find((i) => i.id === p.id);
                    return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.qty) } : p;
                })
            );
            const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
            toast.success("You're offline — sale saved locally, will sync automatically");
            setReceiptSale({
                ...payload,
                id: "offline",
                createdAt: new Date().toISOString(),
                customer: selectedCustomer ? { name: selectedCustomer.name } : null,
            });
            clearCart();
            resetPaymentFields();
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4">
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                    <Search className="h-4 w-4" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products..."
                        className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                </div>

                <div className="mb-4 flex gap-2 overflow-x-auto">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                activeCategory === cat
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto pb-2 sm:grid-cols-3 xl:grid-cols-4">
                    {loading && (
                        <p className="col-span-full py-10 text-center text-sm text-muted-foreground">Loading products...</p>
                    )}
                    {!loading &&
                        filteredProducts.map((product) => (
                            <Card
                                key={product.id}
                                onClick={() => handleAddToCart(product)}
                                className={cn(
                                    "border-border/60 transition-colors",
                                    product.stock === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary/60"
                                )}
                            >
                                <CardContent className="flex flex-col gap-1 p-4">
                                    <span className="text-sm font-medium text-foreground">{product.name}</span>
                                    <span className="text-sm text-primary">Rs. {product.price}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    {!loading && filteredProducts.length === 0 && (
                        <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No products found.</p>
                    )}
                </div>
            </div>

            <Card className="flex w-80 shrink-0 flex-col border-border/60">
                <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-semibold text-foreground">Cart</h2>
                        {items.length > 0 && (
                            <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive">
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto">
                        {items.length === 0 && <p className="pt-8 text-center text-sm text-muted-foreground">Cart is empty.</p>}
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">Rs. {item.price}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => decrementItem(item.id)} className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/70">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-5 text-center text-sm text-foreground">{item.qty}</span>
                                    <button onClick={() => incrementItem(item.id)} className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/70">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => removeItem(item.id)} className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsCredit(false)}
                                className={cn(
                                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                    !isCredit ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                                )}
                            >
                                Cash
                            </button>
                            <button
                                onClick={() => setIsCredit(true)}
                                className={cn(
                                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                    isCredit ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                                )}
                            >
                                Credit (Udhar)
                            </button>
                        </div>

                        {isCredit && (
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} — {c.phone}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>Rs. {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Tax (5%)</span>
                            <span>Rs. {tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold text-foreground">
                            <span>Total</span>
                            <span>Rs. {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button className="mt-4 w-full" onClick={handleCheckout} disabled={items.length === 0}>
                        Checkout
                    </Button>
                </CardContent>
            </Card>

            <ReceiptModal sale={receiptSale} businessName={businessName} onClose={() => setReceiptSale(null)} />
        </div>
    );
}