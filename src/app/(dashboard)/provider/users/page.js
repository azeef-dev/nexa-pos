import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CustomersPage() {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
                <Button>Add Customer</Button>
            </div>
            <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                    No customers added yet. (Credit Tab balance will show here.)
                </CardContent>
            </Card>
        </div>
    );
}