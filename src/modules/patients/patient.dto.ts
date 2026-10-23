import { z } from 'zod';
import { GENDERS } from './patient.constants';
import type { Gender } from './patient.constants';
import type { Patient } from './patient.model';

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();

export const createPatientDto = z
  .object({
    name: z.string().trim().min(1).max(100),
    age: z.number().int().min(0).max(150),
    gender: z.enum(GENDERS),
    phone: optionalText(20),
    address: optionalText(255),
    medicalHistory: z.string().trim().max(5000).optional(),
  })
  .strict();
export type CreatePatientDto = z.infer<typeof createPatientDto>;

export const updatePatientDto = createPatientDto
  .partial()
  .refine((dto) => Object.keys(dto).length > 0, 'Provide at least one field to update');
export type UpdatePatientDto = z.infer<typeof updatePatientDto>;

export interface PatientResponseDto {
  id: number;
  name: string;
  age: number;
  gender: Gender;
  phone: string | null;
  address: string | null;
  medicalHistory: string | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export const toPatientResponse = (p: Patient): PatientResponseDto => ({
  id: p.id,
  name: p.name,
  age: p.age,
  gender: p.gender,
  phone: p.phone ?? null,
  address: p.address ?? null,
  medicalHistory: p.medicalHistory ?? null,
  createdBy: p.createdBy,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
