import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, XCircle } from "lucide-react";

const stats = [
    { label: "Total Providers", value: "0", icon: Building2 },
    { label: "Active Providers", value: "0", icon: CheckCircle2 },
    { label: "Suspended", value: "0", icon: XCircle },
];

export default function SuperAdminHomePage() {
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