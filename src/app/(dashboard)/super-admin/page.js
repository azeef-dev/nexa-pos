import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SuperAdminHomePage() {
    return (
        <div>
            <h1 className="mb-6 text-2xl font-semibold">Super Admin Dashboard</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Providers</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold">0</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm text-muted-foreground">Active Providers</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold">0</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm text-muted-foreground">Suspended</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold">0</CardContent>
                </Card>
            </div>
        </div>
    );
}