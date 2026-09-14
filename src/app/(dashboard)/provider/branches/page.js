"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { branchSchema } from "@/lib/schemas";

export default function BranchesPage() {
    const [showForm, setShowForm] = useState(false);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(branchSchema) });

    async function loadBranches() {
        setLoading(true);
        const res = await fetch("/api/branches");
        if (res.ok) setBranches(await res.json());
        setLoading(false);
    }

    useEffect(() => {
        loadBranches();
    }, []);

    function startEdit(branch) {
        setEditingId(branch.id);
        reset({ name: branch.name, address: branch.address || "" });
        setShowForm(true);
    }

    function cancelForm() {
        setEditingId(null);
        setShowForm(false);
        reset({ name: "", address: "" });
    }

    async function onSubmit(data) {
        const isEditing = Boolean(editingId);
        const res = await fetch(isEditing ? `/api/branches/${editingId}` : "/api/branches", {
            method: isEditing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || `Failed to ${isEditing ? "update" : "add"} branch`);
            return;
        }

        toast.success(isEditing ? `${data.name} updated` : `${data.name} added`);
        cancelForm();
        loadBranches();
    }

    async function removeBranch(id) {
        const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Branch removed");
            loadBranches();
        } else {
            toast.error("Failed to remove branch");
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Branches</h1>
                <Button onClick={() => (showForm ? cancelForm() : setShowForm(true))}>
                    <Plus className="h-4 w-4" />
                    {showForm ? "Cancel" : "Add Branch"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 border-border/60">
                    <CardContent className="p-6">
                        <p className="mb-4 text-sm font-medium text-foreground">
                            {editingId ? "Edit Branch" : "New Branch"}
                        </p>
                        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Branch Name</Label>
                                <Input id="name" placeholder="e.g. Gulshan Outlet" {...register("name")} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="address">Address (optional)</Label>
                                <Input id="address" placeholder="e.g. Block 5, Gulshan" {...register("address")} />
                            </div>
                            <div className="sm:col-span-2">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : editingId ? "Update Branch" : "Save Branch"}
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
                                <th className="px-4 py-3 font-medium">Address</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.map((b) => (
                                <tr key={b.id} className="border-b border-border last:border-0">
                                    <td className="px-4 py-3 text-foreground">{b.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{b.address || "—"}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => startEdit(b)} className="mr-3 text-muted-foreground hover:text-foreground">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => removeBranch(b.id)} className="text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && branches.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                        No branches added yet.
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
