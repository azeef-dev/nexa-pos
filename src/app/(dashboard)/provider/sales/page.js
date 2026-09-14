"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ReceiptModal from "@/components/shared/ReceiptModal";

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
    const [businessName, setBusinessName] = useState("NexaPOS");
    const [selectedSale, setSelectedSale] = useState(null);

    useEffect(() => {
        fetch("/api/sales")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                setSales(data);
                setLoading(false);
            });

        fetch("/api/auth/me")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data && setBusinessName(data.businessName));
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
                                <th className="px-4 py-3 font-medium">Customer</th>
                                <th className="px-4 py-3 font-medium">Branch</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Total</th>
                                <th className="px-4 py-3 font-medium">Time</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale, index) => (
                                <tr key={sale.id} className="border-b border-border last:border-0">
                                    <td className="px-4 py-3 text-foreground">#{sales.length - index}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {sale.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{sale.customer?.name || "—"}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{sale.branch?.name || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={
                                                sale.isCredit
                                                    ? "rounded-md bg-destructive/15 px-2 py-1 text-xs text-destructive"
                                                    : "rounded-md bg-primary/15 px-2 py-1 text-xs text-primary"
                                            }
                                        >
                                            {sale.isCredit ? "Credit" : "Cash"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-foreground">Rs. {sale.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatTime(sale.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => setSelectedSale(sale)} title="View receipt" className="text-muted-foreground hover:text-primary">
                                            <Printer className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && sales.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                        No sales recorded yet.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                        Loading...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <ReceiptModal sale={selectedSale} businessName={businessName} onClose={() => setSelectedSale(null)} />
        </div>
    );
}