"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, Receipt, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const superAdminLinks = [
    { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super-admin/providers", label: "Providers", icon: Building2 },
];

const providerLinks = [
    { href: "/provider", label: "Dashboard", icon: LayoutDashboard },
    { href: "/provider/inventory", label: "Inventory", icon: Package },
    { href: "/provider/users", label: "Customers", icon: Users },
    { href: "/provider/sales", label: "Sales", icon: Receipt },
];

export default function Sidebar() {
    const pathname = usePathname();
    const links = pathname.startsWith("/super-admin") ? superAdminLinks : providerLinks;

    return (
        <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
            <div className="flex h-14 items-center border-b border-sidebar-border px-4">
                <span className="font-semibold text-sidebar-foreground">NexaPOS</span>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-3">
                {links.map((link) => {
                    const Icon = link.icon;
                    const active = pathname === link.href;
                    return (
                        <Link key={link.href} href={link.href}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors",
                                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"
                            )}>
                            <Icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}