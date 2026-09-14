"use client";

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react";

const COLORS = [
    "oklch(0.62 0.13 195)",
    "oklch(0.65 0.15 300)",
    "oklch(0.7 0.15 70)",
    "oklch(0.65 0.15 25)",
    "oklch(0.7 0.1 150)",
];

const tooltipStyle = {
    background: "oklch(0.20 0.025 255)",
    border: "1px solid oklch(0.28 0.025 255)",
    borderRadius: "8px",
    color: "oklch(0.94 0.01 240)",
};

export default function ReportsPage() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch("/api/reports")
            .then((res) => (res.ok ? res.json() : null))
            .then(setData);
    }, []);

    if (!data) {
        return <p className="text-sm text-muted-foreground">Loading reports...</p>;
    }

    const { dailySales, bestSellers, categoryBreakdown, summary } = data;

    const stats = [
        { label: "Revenue (30 days)", value: `Rs. ${summary.totalRevenue.toFixed(2)}`, icon: DollarSign },
        { label: "Total Orders", value: String(summary.totalOrders), icon: ShoppingBag },
        { label: "Avg Order Value", value: `Rs. ${summary.avgOrderValue.toFixed(2)}`, icon: TrendingUp },
    ];

    return (
        <div>
            <h1 className="mb-6 text-2xl font-semibold text-foreground">Reports & Analytics</h1>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
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

            <Card className="mb-6 border-border/60">
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Sales Trend (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-72 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailySales}>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.025 255)" />
                            <XAxis dataKey="date" stroke="oklch(0.62 0.02 245)" fontSize={11} interval={4} />
                            <YAxis stroke="oklch(0.62 0.02 245)" fontSize={11} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="total" stroke="oklch(0.62 0.13 195)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Best Sellers</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72 p-4">
                        {bestSellers.length === 0 ? (
                            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No sales data yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={bestSellers} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.025 255)" />
                                    <XAxis type="number" stroke="oklch(0.62 0.02 245)" fontSize={11} />
                                    <YAxis dataKey="name" type="category" stroke="oklch(0.62 0.02 245)" fontSize={11} width={90} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="qty" fill="oklch(0.62 0.13 195)" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Revenue by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72 p-4">
                        {categoryBreakdown.length === 0 ? (
                            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No sales data yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryBreakdown} dataKey="total" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                        {categoryBreakdown.map((entry, index) => (
                                            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}