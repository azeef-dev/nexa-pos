"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Star } from "lucide-react";

export default function ProviderHomePage() {
    const [report, setReport] = useState({ todaysSales: 0, totalCustomers: 0, bestSeller: "—" });

    useEffect(() => {
        fetch("/api/reports/dashboard")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data && setReport(data));
    }, []);

    const stats = [
        { label: "Today's Sales", value: `Rs. ${report.todaysSales.toFixed(2)}`, icon: DollarSign },
        { label: "Total Customers", value: String(report.totalCustomers), icon: Users },
        { label: "Best Seller (30d)", value: report.bestSeller, icon: Star },
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
