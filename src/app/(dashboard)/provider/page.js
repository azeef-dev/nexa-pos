"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Star } from "lucide-react";
import { useSalesStore } from "@/lib/store/sales-store";
import { useCustomersStore } from "@/lib/store/customers-store";

function isToday(iso) {
    const d = new Date(iso);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function ProviderHomePage() {
    const sales = useSalesStore((s) => s.sales);
    const customers = useCustomersStore((s) => s.customers);

    const todaysSales = sales.filter((s) => isToday(s.date)).reduce((sum, s) => sum + s.total, 0);

    const bestSellerMap = {};
    sales.forEach((sale) => {
        sale.items.forEach((item) => {
            bestSellerMap[item.name] = (bestSellerMap[item.name] || 0) + item.qty;
        });
    });
    const bestSeller = Object.entries(bestSellerMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const stats = [
        { label: "Today's Sales", value: `Rs. ${todaysSales.toFixed(2)}`, icon: DollarSign },
        { label: "Total Customers", value: String(customers.length), icon: Users },
        { label: "Best Seller", value: bestSeller, icon: Star },
    ];

    return (
        <div>
            <h1 className="mb-6 text-2xl font-semibold text-foreground">Dashboard</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map(({ label, value, icon: Icon }) => (
                    <Card key={label} className="border-border/60">
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <p className="text-sm text-muted-foreground">{label}</p>
                                <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                                <Icon className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}