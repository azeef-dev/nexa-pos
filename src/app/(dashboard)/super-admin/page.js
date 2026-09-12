"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, XCircle } from "lucide-react";

export default function SuperAdminHomePage() {
    const [providers, setProviders] = useState([]);

    useEffect(() => {
        fetch("/api/providers")
            .then((res) => (res.ok ? res.json() : []))
            .then(setProviders);
    }, []);

    const active = providers.filter((p) => p.status === "ACTIVE").length;
    const suspended = providers.filter((p) => p.status === "SUSPENDED").length;

    const stats = [
        { label: "Total Providers", value: String(providers.length), icon: Building2 },
        { label: "Active Providers", value: String(active), icon: CheckCircle2 },
        { label: "Suspended", value: String(suspended), icon: XCircle },
    ];

    return (
        <div>
            <h1 className="mb-6 text-2xl font-semibold text-foreground">Super Admin Dashboard</h1>
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