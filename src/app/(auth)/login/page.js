"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Zap, RefreshCw, Sparkles } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
    password: z
        .string()
        .trim()
        .min(6, "Password must be at least 6 characters")
        .regex(/^\S+$/, "Password cannot contain spaces"),
});

const features = [
    { icon: Zap, label: "Fast Checkout" },
    { icon: RefreshCw, label: "Real-time Sync" },
    { icon: Sparkles, label: "AI Insights" },
];

export default function LoginPage() {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(loginSchema) });

    async function onSubmit(data) {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || "Login failed");
            return;
        }

        toast.success("Welcome back!");
        router.push(result.redirectTo);
        router.refresh();
    }

    return (
        <div className="flex min-h-screen">
            <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-linear-to-br from-background via-background to-secondary px-16 lg:flex">
                <div className="mb-8 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                        N
                    </div>
                    <span className="text-xl font-semibold text-foreground">NexaPOS</span>
                </div>
                <h1 className="max-w-md text-4xl font-semibold leading-tight text-foreground">
                    Smarter POS.
                    <br />
                    <span className="text-primary">Bigger Possibilities.</span>
                </h1>
                <p className="mt-4 max-w-sm text-muted-foreground">
                    AI-powered point of sale for modern businesses. Fast, secure, simple.
                </p>
                <div className="mt-10 flex gap-6">
                    {features.map(({ icon: Icon, label }) => (
                        <div key={label} className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
                                <Icon className="h-5 w-5" />
                            </div>
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex w-full flex-col items-center justify-center bg-background px-6 lg:w-1/2">
                <Card className="w-full max-w-sm border-border/60">
                    <CardHeader>
                        <CardTitle>Welcome Back</CardTitle>
                        <CardDescription>Sign in to your NexaPOS account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" placeholder="you@business.com" {...register("email")} />
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" placeholder="Enter your password" {...register("password")} />
                                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                                    Remember me
                                </label>
                                <Link href="#" className="text-sm text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>
                        <div className="my-5 flex items-center gap-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">or</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <Button variant="outline" className="w-full">
                            Continue with Google
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}