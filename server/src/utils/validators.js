/**
 * Czech-specific validators and common schemas
 * 🇨🇿 Validace pro Českou republiku
 */
const { z } = require('zod');

// Email validation
const emailSchema = z.string().email('Neplatný email');

// Czech phone number (+420 XXX XXX XXX)
const czechPhoneSchema = z.string()
  .regex(/^\+420\s?\d{3}\s?\d{3}\s?\d{3}$/, 'Neplatné telefonní číslo')
  .optional()
  .or(z.literal(''));

// Czech address format
const czechAddressSchema = z.object({
  street: z.string().min(3, 'Ulice musí mít alespoň 3 znaky'),
  city: z.string().min(2, 'Město musí mít alespoň 2 znaky'),
  zip: z.string().regex(/^\d{3} \d{2}$/, 'PSČ musí být ve formátu XXX XX'),
  district: z.string().optional() // Praha 1, Holešovice, etc.
}).optional();

// Registration schema
const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
  fullname: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
  phone: czechPhoneSchema,
  address: z.string().optional(),
  role: z.enum(['buyer', 'farmer']).default('buyer')
});

// Login schema
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Update profile schema
const updateProfileSchema = z.object({
  fullname: z.string().min(2, 'Jméno musí mít alespoň 2 znaky').optional(),
  phone: czechPhoneSchema,
  address: z.string().min(5, 'Adresa musí mít alespoň 5 znaků').optional()
});

// Order creation schema
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    total: z.number().min(0)
  })).min(1, 'Order must have at least one item'),
  deliveryDate: z.string(),
  address: z.string().optional()
});

// Subscription creation schema
const createSubscriptionSchema = z.object({
  plan: z.enum(['1month', '3months', '1year']),
  paymentMethod: z.string().optional()
});

module.exports = {
  emailSchema,
  czechPhoneSchema,
  czechAddressSchema,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  createOrderSchema,
  createSubscriptionSchema
};
