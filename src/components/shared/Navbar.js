import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
            <span className="text-sm text-muted-foreground">Welcome back</span>
            <Avatar className="h-8 w-8">
                <AvatarFallback>NP</AvatarFallback>
            </Avatar>
        </header>
    );
}