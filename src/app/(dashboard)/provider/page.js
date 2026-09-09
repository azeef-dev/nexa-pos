import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ProviderHomePage() {
    return (
        <div>
            <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle className="text-sm text-muted-foreground">Today's Sales</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold">Rs. 0</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Customers</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold">0</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm text-muted-foreground">Best Seller</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold">—</CardContent>
                </Card>
            </div>
        </div>
    );
}