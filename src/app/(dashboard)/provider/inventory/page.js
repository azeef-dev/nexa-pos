"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/data/products";
import { inventoryItemSchema as itemSchema } from "@/lib/schemas";

export default function InventoryPage() {
    const [showForm, setShowForm] = useState(false);
    const [items, setItems] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(itemSchema),
        defaultValues: { category: CATEGORIES[1] },
    });

    async function loadItems() {
        setLoading(true);
        const res = await fetch("/api/inventory");
        if (res.ok) setItems(await res.json());
        setLoading(false);
    }

    async function loadBranches() {
        const res = await fetch("/api/branches");
        if (res.ok) setBranches(await res.json());
    }

    useEffect(() => {
        loadItems();
        loadBranches();
    }, []);

    async function onSubmit(data) {
        const isEditing = Boolean(editingId);
        const res = await fetch(isEditing ? `/api/inventory/${editingId}` : "/api/inventory", {
            method: isEditing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, branchId: data.branchId || null }),
        });
        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || `Failed to ${isEditing ? "update" : "add"} item`);
            return;
        }

        toast.success(isEditing ? `${data.name} updated` : `${data.name} added to inventory`);
        cancelForm();
        loadItems();
    }

    function startEdit(item) {
        setEditingId(item.id);
        reset({
            name: item.name,
            category: item.category,
            price: item.price,
            stock: item.stock,
            branchId: item.branchId || "",
        });
        setShowForm(true);
    }

    function cancelForm() {
        setEditingId(null);
        setShowForm(false);
        reset({ name: "", category: CATEGORIES[1], price: "", stock: "", branchId: "" });
    }

    async function removeItem(id) {
        const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
        if (res.ok) {
            const result = await res.json();
            if (result.archived) {
                toast.success("Item has sales history — archived instead of deleted");
            } else {
                toast.success("Item removed");
            }
            loadItems();
        } else {
            toast.error("Failed to remove item");
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
                <Button onClick={() => (showForm ? cancelForm() : setShowForm(true))}>
                    <Plus className="h-4 w-4" />
                    {showForm ? "Cancel" : "Add Item"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 border-border/60">
                    <CardContent className="p-6">
                        <p className="mb-4 text-sm font-medium text-foreground">
                            {editingId ? "Edit Item" : "New Item"}
                        </p>
                        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-5">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Item Name</Label>
                                <Input id="name" placeholder="e.g. Fanta" {...register("name")} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="category">Category</Label>
                                <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                                                    <SelectItem key={c} value={c}>
                                                        {c}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="price">Price (Rs.)</Label>
                                <Input id="price" type="number" step="0.01" placeholder="0.00" {...register("price")} />
                                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="stock">Stock Qty</Label>
                                <Input id="stock" type="number" placeholder="0" {...register("stock")} />
                                {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="branchId">Branch (optional)</Label>
                                <Controller
                                    name="branchId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                                            <SelectTrigger id="branchId">
                                                <SelectValue placeholder="No branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No branch</SelectItem>
                                                {branches.map((b) => (
                                                    <SelectItem key={b.id} value={b.id}>
                                                        {b.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="sm:col-span-5">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : editingId ? "Update Item" : "Save Item"}
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
                                <th className="px-4 py-3 font-medium">Category</th>
                                <th className="px-4 py-3 font-medium">Price</th>
                                <th className="px-4 py-3 font-medium">Stock</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b border-border last:border-0">
                                    <td className="px-4 py-3 text-foreground">{item.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                                    <td className="px-4 py-3 text-foreground">Rs. {item.price}</td>
                                    <td className="px-4 py-3 text-foreground">{item.stock}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={
                                                item.stock === 0
                                                    ? "rounded-md bg-destructive/15 px-2 py-1 text-xs text-destructive"
                                                    : item.stock <= 10
                                                        ? "rounded-md bg-chart-3/20 px-2 py-1 text-xs text-chart-3"
                                                        : "rounded-md bg-primary/15 px-2 py-1 text-xs text-primary"
                                            }
                                        >
                                            {item.stock === 0 ? "Out of Stock" : item.stock <= 10 ? "Low Stock" : "In Stock"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => startEdit(item)} className="mr-3 text-muted-foreground hover:text-foreground">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No items added yet.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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