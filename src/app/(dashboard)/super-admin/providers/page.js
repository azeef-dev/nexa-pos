import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ProvidersPage() {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Providers</h1>
                <Button>Add Provider</Button>
            </div>
            <Card>
                <CardHeader><CardTitle className="text-sm text-muted-foreground">Provider list</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Abhi koi Provider add nahi hua. (Prisma set hone ke baad data yahan aayega.)
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}