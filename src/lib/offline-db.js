import Dexie from "dexie";

export const offlineDb = new Dexie("nexapos-offline");

offlineDb.version(1).stores({
    pendingSales: "++localId, createdAt",
});

export async function queueOfflineSale(sale) {
    return offlineDb.pendingSales.add({ ...sale, createdAt: new Date().toISOString() });
}

export async function getPendingSales() {
    return offlineDb.pendingSales.toArray();
}

export async function removePendingSale(localId) {
    return offlineDb.pendingSales.delete(localId);
}

export async function countPendingSales() {
    return offlineDb.pendingSales.count();
}