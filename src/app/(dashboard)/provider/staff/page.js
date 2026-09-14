"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { staffSchema } from "@/lib/schemas";

export default function StaffPage() {
    const [showForm, setShowForm] = useState(false);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(staffSchema) });

    async function loadStaff() {
        setLoading(true);
        const res = await fetch("/api/staff");
        if (res.ok) setStaff(await res.json());
        setLoading(false);
    }

    useEffect(() => {
        loadStaff();
    }, []);

    async function onSubmit(data) {
        const res = await fetch("/api/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || "Failed to add staff member");
            return;
        }

        toast.success(`${data.name} added`);
        reset();
        setShowForm(false);
        loadStaff();
    }

    async function removeStaff(id) {
        const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Staff member removed");
            loadStaff();
        } else {
            toast.error("Failed to remove staff member");
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Staff</h1>
                <Button onClick={() => setShowForm((s) => !s)}>
                    <Plus className="h-4 w-4" />
                    {showForm ? "Cancel" : "Add Staff"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 border-border/60">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" placeholder="e.g. Bilal Cashier" {...register("name")} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="staff@example.com" {...register("email")} />
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="password">Temporary Password</Label>
                                <Input id="password" type="password" placeholder="Set a login password" {...register("password")} />
                                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                            </div>
                            <div className="sm:col-span-3">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Adding..." : "Save Staff Member"}
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
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((s) => (
                                <tr key={s.id} className="border-b border-border last:border-0">
                                    <td className="px-4 py-3 text-foreground">{s.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => removeStaff(s.id)} className="text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && staff.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                        No staff added yet.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
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
