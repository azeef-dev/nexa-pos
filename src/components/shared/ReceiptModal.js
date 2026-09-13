"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

function ReceiptContent({ sale, businessName }) {
    const customerName = sale.customer?.name;

    return (
        <div className="receipt-print-area mx-auto w-full max-w-70 rounded-md bg-white p-4 font-mono text-[13px] text-black shadow-lg">
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
    );
}

export default function ReceiptModal({ sale, businessName, onClose }) {
    useEffect(() => {
        if (!sale) return;

        document.getElementById("receipt-print-button")?.focus();

        function handleAfterPrint() {
            toast.success("Receipt printed successfully");
        }

        window.addEventListener("afterprint", handleAfterPrint);
        return () => window.removeEventListener("afterprint", handleAfterPrint);
    }, [sale]);

    if (!sale) return null;

    function handlePrint() {
        window.print();
    }

    return (
        <>
            {createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:hidden">
                    <div className="w-full max-w-sm rounded-2xl bg-neutral-800 p-5 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-semibold text-white">Receipt</h2>
                            <button onClick={onClose} className="text-neutral-400 hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="rounded-lg bg-neutral-900 p-4">
                            <ReceiptContent sale={sale} businessName={businessName} />
                        </div>

                        <div className="mt-5 flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={onClose}>
                                Close
                            </Button>
                            <Button id="receipt-print-button" className="flex-1" onClick={handlePrint}>
                                <Printer className="h-4 w-4" />
                                Print
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {createPortal(
                <div id="receipt-print-root" className="hidden">
                    <ReceiptContent sale={sale} businessName={businessName} />
                </div>,
                document.body
            )}
        </>
    );
}