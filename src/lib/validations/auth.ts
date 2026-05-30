import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido.')
    .email('Ingresa un correo válido.'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida.'),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(50, 'El nombre es demasiado largo.'),
    lastName: z
      .string()
      .min(2, 'El apellido debe tener al menos 2 caracteres.')
      .max(50, 'El apellido es demasiado largo.'),
    email: z
      .string()
      .min(1, 'El correo es requerido.')
      .email('Ingresa un correo válido.'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula.')
      .regex(/[0-9]/, 'Debe contener al menos un número.'),
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;