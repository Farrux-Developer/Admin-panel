import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Обязательное поле").email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Минимум 2 символа")
    .max(48, "Максимум 48 символов"),
  email: z.string().min(1, "Обязательное поле").email("Некорректный email"),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .regex(/[0-9]/, "Нужна хотя бы одна цифра"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(48, "Максимум 48 символов"),
  avatar: z.string().nullable().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(64),
  category: z.string().min(2).max(32),
  price: z.number().min(0, "Цена не может быть отрицательной"),
  stock: z.number().int().min(0),
  status: z.enum(["active", "hidden"]),
  description: z.string().max(600).default(""),
  image: z.string().optional(),
});

export const userPatchSchema = z.object({
  name: z.string().min(2).max(48).optional(),
  email: z.string().email().optional(),
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "blocked"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
