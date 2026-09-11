import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function InventoryPage() {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
                <Button>Add Item</Button>
            </div>
            <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">No items added yet.</CardContent>
            </Card>
        </div>
    );
}