"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

function formatTime(iso) {
    return new Date(iso).toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
    });
}

export default function SalesPage() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/sales")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                setSales(data);
                setLoading(false);
            });
    }, []);

    return (
        <div>
            <h1 className="mb-6 text-2xl font-semibold text-foreground">Sales</h1>
            <Card className="border-border/60">
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Order</th>
                                <th className="px-4 py-3 font-medium">Items</th>
                                <th className="px-4 py-3 font-medium">Subtotal</th>
                                <th className="px-4 py-3 font-medium">Tax</th>
                                <th className="px-4 py-3 font-medium">Total</th>
                                <th className="px-4 py-3 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale, index) => (
                                <tr key={sale.id} className="border-b border-border last:border-0">
                                    <td className="px-4 py-3 text-foreground">#{sales.length - index}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {sale.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                                    </td>
                                    <td className="px-4 py-3 text-foreground">Rs. {sale.subtotal.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">Rs. {sale.tax.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-medium text-foreground">Rs. {sale.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatTime(sale.createdAt)}</td>
                                </tr>
                            ))}
                            {!loading && sales.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No sales recorded yet.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        Loading...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}