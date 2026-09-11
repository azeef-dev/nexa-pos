"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Search, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/data/products";
import { useCartStore } from "@/lib/store/cart-store";

const TAX_RATE = 0.05;

export default function PosPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");

    const items = useCartStore((s) => s.items);
    const addItem = useCartStore((s) => s.addItem);
    const incrementItem = useCartStore((s) => s.incrementItem);
    const decrementItem = useCartStore((s) => s.decrementItem);
    const removeItem = useCartStore((s) => s.removeItem);
    const clearCart = useCartStore((s) => s.clearCart);

    const filteredProducts = PRODUCTS.filter((p) => {
        const matchesCategory = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    function handleCheckout() {
        if (items.length === 0) return;
        // TODO: send order to backend once API is ready
        toast.success(`Order placed — Rs. ${total.toFixed(2)}`);
        clearCart();
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
                    {filteredProducts.map((product) => (
                        <Card
                            key={product.id}
                            onClick={() => addItem(product)}
                            className="cursor-pointer border-border/60 transition-colors hover:border-primary/60"
                        >
                            <CardContent className="flex flex-col gap-1 p-4">
                                <span className="text-sm font-medium text-foreground">{product.name}</span>
                                <span className="text-sm text-primary">Rs. {product.price}</span>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredProducts.length === 0 && (
                        <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                            No products found.
                        </p>
                    )}
                </div>
            </div>

            <Card className="flex w-80 shrink-0 flex-col border-border/60">
                <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-semibold text-foreground">Cart</h2>
                        {items.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-xs text-muted-foreground hover:text-destructive"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto">
                        {items.length === 0 && (
                            <p className="pt-8 text-center text-sm text-muted-foreground">Cart is empty.</p>
                        )}
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">Rs. {item.price}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => decrementItem(item.id)}
                                        className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/70"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-5 text-center text-sm text-foreground">{item.qty}</span>
                                    <button
                                        onClick={() => incrementItem(item.id)}
                                        className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/70"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
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
        </div>
    );
}