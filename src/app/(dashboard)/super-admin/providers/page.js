import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ProvidersPage() {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Providers</h1>
                <Button>Add Provider</Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Provider list</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No providers added yet. (Data will appear here once Prisma is set up.)
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}