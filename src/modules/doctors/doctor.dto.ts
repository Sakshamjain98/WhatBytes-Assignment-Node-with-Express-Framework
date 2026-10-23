import { z } from 'zod';
import type { Doctor } from './doctor.model';

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();

export const createDoctorDto = z
  .object({
    name: z.string().trim().min(1).max(100),
    specialization: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email().max(255).optional(),
    phone: optionalText(20),
    experienceYears: z.number().int().min(0).max(80).optional(),
  })
  .strict();
export type CreateDoctorDto = z.infer<typeof createDoctorDto>;

export const updateDoctorDto = createDoctorDto
  .partial()
  .refine((dto) => Object.keys(dto).length > 0, 'Provide at least one field to update');
export type UpdateDoctorDto = z.infer<typeof updateDoctorDto>;

export interface DoctorResponseDto {
  id: number;
  name: string;
  specialization: string;
  email: string | null;
  phone: string | null;
  experienceYears: number | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export const toDoctorResponse = (d: Doctor): DoctorResponseDto => ({
  id: d.id,
  name: d.name,
  specialization: d.specialization,
  email: d.email ?? null,
  phone: d.phone ?? null,
  experienceYears: d.experienceYears ?? null,
  createdBy: d.createdBy,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});
