"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changePasswordSchema } from "@/lib/schemas";

export default function ChangePasswordForm() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(changePasswordSchema) });

    async function onSubmit(data) {
        const res = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || "Failed to change password");
            return;
        }

        toast.success("Password updated");
        reset();
    }

    return (
        <Card className="max-w-md border-border/60">
            <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" {...register("currentPassword")} />
                        {errors.currentPassword && (
                            <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" {...register("newPassword")} />
                        {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
                    </div>
                    <div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Update Password"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
