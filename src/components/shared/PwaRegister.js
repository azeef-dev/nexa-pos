"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { syncOfflineSales } from "@/lib/sync-offline-sales";

export default function PwaRegister() {
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => { });
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