import { z } from 'zod';

export const customerRegisterSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required' }).max(255),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(100, { message: 'Password must be at most 100 characters' })
    .regex(/[A-Za-z]/, { message: 'Password must contain at least one letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  full_name: z.string().min(2, { message: 'Full name must be at least 2 characters' }).max(100),
  phone: z.string().max(32).optional().nullable()
});

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;

export const customerLoginSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required' }),
  password: z.string().min(1, { message: 'Password is required' })
});

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(10, { message: 'Verification token is required' })
});

export const resendVerificationSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required' })
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required' })
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, { message: 'Reset token is required' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(100)
    .regex(/[A-Za-z]/, { message: 'Password must contain at least one letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, { message: 'Refresh token is required' })
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const updateCustomerProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().max(32).optional().nullable()
});

export const customerPreferencesSchema = z.object({
  gender_presentation: z.enum(['ALL', 'WOMENSWEAR', 'MENSWEAR', 'AVANT_GARDE']).optional(),
  favorite_categories: z.array(z.string()).optional(),
  preferred_styles: z.array(z.string()).optional(),
  preferred_fits: z.array(z.string()).optional(),
  preferred_sizes: z.array(z.string()).optional(),
  preferred_colors: z.array(z.string()).optional(),
  price_range_min_cents: z.number().int().nonnegative().optional(),
  price_range_max_cents: z.number().int().nonnegative().optional(),
  onboarding_completed: z.boolean().optional(),
  newsletter_subscribed: z.boolean().optional()
});

export type CustomerPreferencesInput = z.infer<typeof customerPreferencesSchema>;

export const customerAddressSchema = z.object({
  label: z.string().min(1).max(64).default('Home'),
  recipient_name: z.string().min(2).max(255),
  phone: z.string().min(5).max(32),
  address_line1: z.string().min(3).max(255),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().min(2).max(128),
  state_province: z.string().min(2).max(128),
  postal_code: z.string().min(2).max(32),
  country_code: z.string().length(2).default('US'),
  is_default_shipping: z.boolean().default(false),
  is_default_billing: z.boolean().default(false)
});

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;
