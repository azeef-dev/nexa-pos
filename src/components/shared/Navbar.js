"use client";

import { useRouter } from "next/navigation";
import { Search, Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
                />
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>
            <button
                onClick={handleLogout}
                title="Log out"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
                <LogOut className="h-4 w-4" />
            </button>
            <Avatar className="h-9 w-9">
                <AvatarFallback>NP</AvatarFallback>
            </Avatar>
        </header>
    );
}