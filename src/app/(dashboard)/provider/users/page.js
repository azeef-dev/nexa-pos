"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const customerSchema = z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
    creditBalance: z.coerce.number().min(0, "Balance cannot be negative").optional(),
});

export default function CustomersPage() {
    const [showForm, setShowForm] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(customerSchema) });

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
        const res = await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, creditBalance: data.creditBalance || 0 }),
        });
        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || "Failed to add customer");
            return;
        }

        toast.success(`${data.name} added`);
        reset();
        setShowForm(false);
        loadCustomers();
    }

    async function removeCustomer(id) {
        const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
        if (res.ok) loadCustomers();
        else toast.error("Failed to remove customer");
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
                <Button onClick={() => setShowForm((s) => !s)}>
                    <Plus className="h-4 w-4" />
                    {showForm ? "Cancel" : "Add Customer"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 border-border/60">
                    <CardContent className="p-6">
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
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="creditBalance">Opening Credit Balance (Rs.)</Label>
                                <Input id="creditBalance" type="number" placeholder="0" {...register("creditBalance")} />
                            </div>
                            <div className="sm:col-span-3">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Adding..." : "Save Customer"}
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
                                <tr key={c.id} className="border-b border-border last:border-0">
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
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => removeCustomer(c.id)} className="text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
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