"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Users, Package, Receipt, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const superAdminLinks = [
    { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super-admin/providers", label: "Providers", icon: Building2 },
    { href: "/super-admin/settings", label: "Settings", icon: Settings },
];

const providerLinks = [
    { href: "/provider", label: "Dashboard", icon: LayoutDashboard },
    { href: "/provider/pos", label: "POS", icon: ShoppingCart },
    { href: "/provider/inventory", label: "Inventory", icon: Package },
    { href: "/provider/users", label: "Customers", icon: Users },
    { href: "/provider/sales", label: "Sales", icon: Receipt },
    { href: "/provider/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const isSuperAdmin = pathname.startsWith("/super-admin");
    const links = isSuperAdmin ? superAdminLinks : providerLinks;

    return (
        <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
            <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    N
                </div>
                <span className="text-base font-semibold text-sidebar-foreground">NexaPOS</span>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-3">
                {links.map((link) => {
                    const Icon = link.icon;
                    const active = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                active
                                    ? "bg-sidebar-primary/15 text-sidebar-primary"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-sidebar-border p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-foreground">
                        {isSuperAdmin ? "SA" : "AT"}
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-medium text-sidebar-foreground">
                            {isSuperAdmin ? "Super Admin" : "Ali Traders"}
                        </p>
                        <p className="text-xs text-sidebar-foreground/60">
                            {isSuperAdmin ? "Administrator" : "Provider"}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}