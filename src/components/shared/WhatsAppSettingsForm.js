"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { whatsappSettingsSchema } from "@/lib/schemas";

export default function WhatsAppSettingsForm() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(whatsappSettingsSchema) });

    useEffect(() => {
        fetch("/api/settings/whatsapp")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data?.whatsappPhoneNumberId && reset({ whatsappPhoneNumberId: data.whatsappPhoneNumberId }));
    }, [reset]);

    async function onSubmit(data) {
        const res = await fetch("/api/settings/whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || "Failed to save WhatsApp settings");
            return;
        }

        toast.success("WhatsApp number connected");
    }

    return (
        <Card className="max-w-md border-border/60">
            <CardHeader>
                <CardTitle>WhatsApp Order Assistant</CardTitle>
                <CardDescription>
                    Paste the Phone Number ID from your Meta App dashboard to let customers order and get credit
                    reminders on this WhatsApp number.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="whatsappPhoneNumberId">WhatsApp Phone Number ID</Label>
                        <Input
                            id="whatsappPhoneNumberId"
                            placeholder="e.g. 109876543212345"
                            {...register("whatsappPhoneNumberId")}
                        />
                        {errors.whatsappPhoneNumberId && (
                            <p className="text-xs text-destructive">{errors.whatsappPhoneNumberId.message}</p>
                        )}
                    </div>
                    <div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}