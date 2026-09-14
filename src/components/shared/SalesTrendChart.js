"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-sm">
            <p className="mb-1 font-medium text-popover-foreground">{label}</p>
            <p className="text-muted-foreground">Rs. {payload[0].value.toFixed(2)}</p>
        </div>
    );
}

export default function SalesTrendChart({ data }) {
    return (
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip />} />
                    <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
