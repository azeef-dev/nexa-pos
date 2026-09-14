"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { syncOfflineSales } from "@/lib/sync-offline-sales";

export default function PwaRegister() {
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        if (process.env.NODE_ENV === "production") {
            navigator.serviceWorker.register("/sw.js").catch(() => { });
        } else {
            navigator.serviceWorker.getRegistrations().then((regs) => {
                regs.forEach((reg) => reg.unregister());
            });
        }
    }, []);

    useEffect(() => {
        if (isOnline) {
            syncOfflineSales().then((count) => {
                if (count > 0) toast.success(`${count} offline sale(s) synced`);
            });
        }
    }, [isOnline]);

    return null;
}