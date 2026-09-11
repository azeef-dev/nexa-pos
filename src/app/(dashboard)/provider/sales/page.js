import { Card, CardContent } from "@/components/ui/card";

export default function SalesPage() {
    return (
        <div>
            <h1 className="mb-6 text-2xl font-semibold text-foreground">Sales</h1>
            <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">No sales recorded yet.</CardContent>
            </Card>
        </div>
    );
}