"use client";

import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReceiptModal({ sale, businessName, onClose }) {
    if (!sale) return null;

    const customerName = sale.customer?.name;

    function handlePrint() {
        window.print();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="flex max-h-[90vh] w-full max-w-sm flex-col rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="font-semibold text-foreground">Receipt</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-secondary/20 p-6">
                    <div className="receipt-print-area mx-auto w-full max-w-70 rounded-md bg-white p-4 font-mono text-[13px] text-black shadow-sm">
                        <p className="text-center text-base font-bold">{businessName}</p>
                        <p className="text-center text-[11px] text-gray-500">
                            {new Date(sale.createdAt).toLocaleString()}
                        </p>
                        <div className="my-2 border-t border-dashed border-gray-400" />
                        <div className="flex justify-between text-[11px] font-bold">
                            <span>Item</span>
                            <span className="flex gap-4">
                                <span>Qty</span>
                                <span>Price</span>
                            </span>
                        </div>
                        {sale.items.map((item, i) => (
                            <div key={i} className="flex justify-between py-0.5">
                                <span className="truncate pr-2">{item.name}</span>
                                <span className="flex shrink-0 gap-4">
                                    <span className="w-6 text-center">{item.qty}</span>
                                    <span className="w-14 text-right">Rs. {item.price.toFixed(2)}</span>
                                </span>
                            </div>
                        ))}
                        <div className="my-2 border-t border-dashed border-gray-400" />
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>Rs. {sale.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Tax (5%)</span>
                            <span>Rs. {sale.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                            <span>Total</span>
                            <span>Rs. {sale.total.toFixed(2)}</span>
                        </div>
                        {customerName && (
                            <>
                                <div className="my-2 border-t border-dashed border-gray-400" />
                                <p>
                                    Customer: {customerName}
                                    {sale.isCredit ? " (Credit)" : ""}
                                </p>
                            </>
                        )}
                        <div className="my-2 border-t border-dashed border-gray-400" />
                        <p className="text-center text-[11px] text-gray-500">Thank you for shopping with us!</p>
                    </div>
                </div>

                <div className="flex gap-2 border-t border-border p-4">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Close
                    </Button>
                    <Button className="flex-1" onClick={handlePrint}>
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>
        </div>
    );
}