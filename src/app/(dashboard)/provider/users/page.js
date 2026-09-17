"use client";

import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Plus, Trash2, Wallet, Pencil, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { customerSchema, creditPaymentSchema as paymentSchema } from "@/lib/schemas";

export default function CustomersPage() {
    const [showForm, setShowForm] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openCustomerId, setOpenCustomerId] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(customerSchema) });

    const {
        register: registerPayment,
        handleSubmit: handlePaymentSubmit,
        reset: resetPayment,
        formState: { errors: paymentErrors, isSubmitting: isPaymentSubmitting },
    } = useForm({ resolver: zodResolver(paymentSchema) });

    async function loadCustomers() {
        setLoading(true);
        const res = await fetch("/api/customers");
        if (res.ok) setCustomers(await res.json());
        setLoading(false);
    }

    useEffect(() => {
        loadCustomers();
    }, []);

    async function onSubmit(data) {
        const isEditing = Boolean(editingId);
        const res = await fetch(isEditing ? `/api/customers/${editingId}` : "/api/customers", {
            method: isEditing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
                isEditing ? { name: data.name, phone: data.phone } : { ...data, creditBalance: data.creditBalance || 0 }
            ),
        });
        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || `Failed to ${isEditing ? "update" : "add"} customer`);
            return;
        }

        toast.success(isEditing ? `${data.name} updated` : `${data.name} added`);
        cancelForm();
        loadCustomers();
    }

    function startEdit(customer) {
        setEditingId(customer.id);
        reset({ name: customer.name, phone: customer.phone });
        setShowForm(true);
    }

    function cancelForm() {
        setEditingId(null);
        setShowForm(false);
        reset({ name: "", phone: "", creditBalance: "" });
    }

    async function removeCustomer(id) {
        const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
        if (res.ok) {
            const result = await res.json();
            if (result.archived) {
                toast.success("Customer has transaction history — archived instead of deleted");
            } else {
                toast.success("Customer removed");
            }
            loadCustomers();
        } else {
            toast.error("Failed to remove customer");
        }
    }

    async function sendReminder(id) {
        const res = await fetch(`/api/customers/${id}/credit/remind`, { method: "POST" });
        let result = {};
        try {
            result = await res.json();
        } catch {
            // Server errored before it could send a JSON body — show a
            // generic message instead of crashing on the empty response.
        }

        if (!res.ok) {
            toast.error(result.error || "Failed to send reminder — check the server logs");
            return;
        }
        toast.success("Reminder sent on WhatsApp");
    }
    
    async function toggleCreditTab(customerId) {
        if (openCustomerId === customerId) {
            setOpenCustomerId(null);
            return;
        }
        setOpenCustomerId(customerId);
        resetPayment();
        const res = await fetch(`/api/customers/${customerId}/credit`);
        if (res.ok) setTransactions(await res.json());
    }

    async function onPaymentSubmit(data) {
        const customer = customers.find((c) => c.id === openCustomerId);
        if (customer && data.amount > customer.creditBalance) {
            toast.error(`Payment cannot exceed the outstanding balance of Rs. ${customer.creditBalance}`);
            return;
        }

        const res = await fetch(`/api/customers/${openCustomerId}/credit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || "Failed to record payment");
            return;
        }

        toast.success("Payment recorded");
        resetPayment();
        loadCustomers();
        const historyRes = await fetch(`/api/customers/${openCustomerId}/credit`);
        if (historyRes.ok) setTransactions(await historyRes.json());
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
                <Button onClick={() => (showForm ? cancelForm() : setShowForm(true))}>
                    <Plus className="h-4 w-4" />
                    {showForm ? "Cancel" : "Add Customer"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 border-border/60">
                    <CardContent className="p-6">
                        <p className="mb-4 text-sm font-medium text-foreground">
                            {editingId ? "Edit Customer" : "New Customer"}
                        </p>
                        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Customer Name</Label>
                                <Input id="name" placeholder="e.g. Ahmed Khan" {...register("name")} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" placeholder="+92 3xx xxxxxxx" {...register("phone")} />
                                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                            </div>
                            {!editingId && (
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="creditBalance">Opening Credit Balance (Rs.)</Label>
                                    <Input id="creditBalance" type="number" placeholder="0" {...register("creditBalance")} />
                                </div>
                            )}
                            <div className="sm:col-span-3">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : editingId ? "Update Customer" : "Save Customer"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="border-border/60">
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Phone</th>
                                <th className="px-4 py-3 font-medium">Credit Balance</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <Fragment key={c.id}>
                                    <tr className="border-b border-border last:border-0">
                                        <td className="px-4 py-3 text-foreground">{c.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                                        <td className="px-4 py-3 text-foreground">Rs. {c.creditBalance}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    c.creditBalance > 0
                                                        ? "rounded-md bg-destructive/15 px-2 py-1 text-xs text-destructive"
                                                        : "rounded-md bg-primary/15 px-2 py-1 text-xs text-primary"
                                                }
                                            >
                                                {c.creditBalance > 0 ? "Due" : "Clear"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                {c.creditBalance > 0 && (
                                                    <button
                                                        onClick={() => sendReminder(c.id)}
                                                        title="Send WhatsApp Reminder"
                                                        className="text-muted-foreground hover:text-primary"
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => toggleCreditTab(c.id)} title="Credit Tab" className="text-muted-foreground hover:text-primary">
                                                    <Wallet className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => startEdit(c)} title="Edit Customer" className="text-muted-foreground hover:text-foreground">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => removeCustomer(c.id)} className="text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {openCustomerId === c.id && (
                                        <tr className="border-b border-border bg-secondary/20 last:border-0">
                                            <td colSpan={5} className="px-4 py-4">
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <p className="mb-2 text-xs font-medium text-muted-foreground">Recent Transactions</p>
                                                        <div className="max-h-40 space-y-2 overflow-y-auto">
                                                            {transactions.length === 0 && (
                                                                <p className="text-xs text-muted-foreground">No transactions yet.</p>
                                                            )}
                                                            {transactions.map((t) => (
                                                                <div key={t.id} className="flex items-center justify-between text-xs">
                                                                    <span className="text-muted-foreground">
                                                                        {t.type === "CHARGE" ? "Charge" : "Payment"}
                                                                        {t.note ? ` — ${t.note}` : ""}
                                                                    </span>
                                                                    <span className={t.type === "CHARGE" ? "text-destructive" : "text-primary"}>
                                                                        {t.type === "CHARGE" ? "+" : "-"}Rs. {t.amount}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                            Record Payment{" "}
                                                            <span className="text-foreground">(owes Rs. {c.creditBalance})</span>
                                                        </p>
                                                        <form onSubmit={handlePaymentSubmit(onPaymentSubmit)} className="flex flex-col gap-2">
                                                            <Input type="number" step="0.01" placeholder="Amount (Rs.)" {...registerPayment("amount")} />
                                                            {paymentErrors.amount && (
                                                                <p className="text-xs text-destructive">{paymentErrors.amount.message}</p>
                                                            )}
                                                            <Input placeholder="Note (optional)" {...registerPayment("note")} />
                                                            <Button type="submit" size="sm" disabled={isPaymentSubmitting}>
                                                                {isPaymentSubmitting ? "Saving..." : "Save Payment"}
                                                            </Button>
                                                        </form>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                            {!loading && customers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        No customers added yet.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        Loading...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}