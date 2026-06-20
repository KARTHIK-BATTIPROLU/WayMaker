import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const newProjectSchema = z.object({
  idea: z.string().min(1, 'Please describe your business idea').max(2000),
  industry: z.string().max(200).optional(),
  targetAudience: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
})
