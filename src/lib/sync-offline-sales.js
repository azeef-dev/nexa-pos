import { getPendingSales, removePendingSale } from "@/lib/offline-db";

export async function syncOfflineSales() {
    const pending = await getPendingSales();
    let synced = 0;

    for (const sale of pending) {
        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: sale.items,
                    subtotal: sale.subtotal,
                    tax: sale.tax,
                    total: sale.total,
                    customerId: sale.customerId || null,
                    isCredit: !!sale.isCredit,
                }),
            });

            if (res.ok) {
                await removePendingSale(sale.localId);
                synced++;
            }
        } catch {
            break;
        }
    }

    return synced;
}