import { z } from "zod";

// Shared between client-side forms (react-hook-form + zodResolver) and the
// API routes, so both sides always agree on what a valid payload looks like.

export const inventoryItemSchema = z.object({
    name: z.string().trim().min(1, "Item name is required"),
    category: z.string().min(1, "Select a category"),
    price: z.coerce.number().positive("Price must be greater than 0"),
    stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
});

export const customerSchema = z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
    creditBalance: z.coerce.number().min(0, "Balance cannot be negative").optional(),
});

export const customerUpdateSchema = z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
});

export const creditPaymentSchema = z.object({
    amount: z.coerce.number().positive("Enter an amount greater than 0"),
    note: z.string().trim().optional(),
});

const saleItemSchema = z.object({
    id: z.string().min(1),
    qty: z.coerce
        .number()
        .int("Item quantities must be positive whole numbers")
        .positive("Item quantities must be positive whole numbers"),
});

export const saleSchema = z
    .object({
        items: z.array(saleItemSchema).min(1, "Cart is empty"),
        customerId: z.string().min(1).nullable().optional(),
        isCredit: z.boolean().optional(),
    })
    .refine((data) => !data.isCredit || data.customerId, {
        message: "Select a customer for a credit sale",
        path: ["customerId"],
    });

export const providerSchema = z.object({
    businessName: z.string().trim().min(1, "Business name is required"),
    ownerName: z.string().trim().min(1, "Owner name is required"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
    password: z
        .string()
        .trim()
        .min(6, "Password must be at least 6 characters")
        .regex(/^\S+$/, "Password cannot contain spaces"),
});
