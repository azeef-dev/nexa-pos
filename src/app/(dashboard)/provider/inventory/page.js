import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function InventoryPage() {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Inventory</h1>
                <Button>Add Item</Button>
            </div>
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Abhi koi item add nahi hua.</CardContent></Card>
        </div>
    );
}