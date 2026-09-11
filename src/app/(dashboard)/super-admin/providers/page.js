"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Trash2, Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useProvidersStore } from "@/lib/store/providers-store";

const providerSchema = z.object({
    businessName: z.string().trim().min(1, "Business name is required"),
    ownerName: z.string().trim().min(1, "Owner name is required"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
});

export default function ProvidersPage() {
    const [showForm, setShowForm] = useState(false);
    const providers = useProvidersStore((s) => s.providers);
    const addProvider = useProvidersStore((s) => s.addProvider);
    const toggleStatus = useProvidersStore((s) => s.toggleStatus);
    const removeProvider = useProvidersStore((s) => s.removeProvider);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(providerSchema) });

    function onSubmit(data) {
        addProvider(data);
        toast.success(`${data.businessName} added`);
        reset();
        setShowForm(false);
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Providers</h1>
                <Button onClick={() => setShowForm((s) => !s)}>
                    <Plus className="h-4 w-4" />
                    {showForm ? "Cancel" : "Add Provider"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 border-border/60">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="businessName">Business Name</Label>
                                <Input id="businessName" placeholder="e.g. Ali Traders" {...register("businessName")} />
                                {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="ownerName">Owner Name</Label>
                                <Input id="ownerName" placeholder="e.g. Ahmed Ali" {...register("ownerName")} />
                                {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="owner@business.com" {...register("email")} />
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>
                            <div className="sm:col-span-3">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Adding..." : "Save Provider"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Provider list</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Business</th>
                                <th className="px-4 py-3 font-medium">Owner</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {providers.map((p) => (
                                <tr key={p.id} className="border-b border-border last:border-0">
                                    <td className="px-4 py-3 text-foreground">{p.businessName}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.ownerName}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={
                                                p.status === "Active"
                                                    ? "rounded-md bg-primary/15 px-2 py-1 text-xs text-primary"
                                                    : "rounded-md bg-destructive/15 px-2 py-1 text-xs text-destructive"
                                            }
                                        >
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleStatus(p.id)}
                                                title={p.status === "Active" ? "Suspend" : "Activate"}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                {p.status === "Active" ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                            </button>
                                            <button onClick={() => removeProvider(p.id)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {providers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        No providers added yet.
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