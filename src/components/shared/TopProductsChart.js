"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { name, qty } = payload[0].payload;
    return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-sm">
            <p className="mb-1 font-medium text-popover-foreground">{name}</p>
            <p className="text-muted-foreground">{qty} sold</p>
        </div>
    );
}

export default function TopProductsChart({ data }) {
    if (data.length === 0) {
        return <p className="py-10 text-center text-sm text-muted-foreground">No sales in the last 30 days.</p>;
    }

    return (
        <div style={{ height: Math.max(data.length * 40, 80) }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        width={110}
                        tick={{ fill: "var(--foreground)", fontSize: 12 }}
                    />
                    <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip />} />
                    <Bar dataKey="qty" fill="var(--chart-2)" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        <LabelList dataKey="qty" position="right" fill="var(--muted-foreground)" fontSize={12} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
