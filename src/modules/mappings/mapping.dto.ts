import { z } from 'zod';
import { toDoctorResponse } from '../doctors/doctor.dto';
import type { DoctorResponseDto } from '../doctors/doctor.dto';
import type { Doctor } from '../doctors/doctor.model';
import type { Patient } from '../patients/patient.model';
import type { Mapping } from './mapping.model';

const id = z.number().int().positive();

export const createMappingDto = z.object({ patientId: id, doctorId: id }).strict();
export type CreateMappingDto = z.infer<typeof createMappingDto>;

export const patientIdParamDto = z.object({ patientId: z.coerce.number().int().positive() });

export interface PatientSummaryDto {
  id: number;
  name: string;
}

export interface MappingResponseDto {
  id: number;
  patientId: number;
  doctorId: number;
  createdAt: Date;
  patient?: PatientSummaryDto;
  doctor?: DoctorResponseDto;
}

export interface AssignedDoctorDto extends DoctorResponseDto {
  mappingId: number;
  assignedAt: Date;
}

export interface PatientDoctorsResponseDto {
  patient: PatientSummaryDto;
  doctors: AssignedDoctorDto[];
}

export const toPatientSummary = (p: Patient): PatientSummaryDto => ({ id: p.id, name: p.name });

export const toMappingResponse = (m: Mapping): MappingResponseDto => ({
  id: m.id,
  patientId: m.patientId,
  doctorId: m.doctorId,
  createdAt: m.createdAt,
  ...(m.patient && { patient: toPatientSummary(m.patient) }),
  ...(m.doctor && { doctor: toDoctorResponse(m.doctor) }),
});

export const toAssignedDoctor = (m: Mapping, doctor: Doctor): AssignedDoctorDto => ({
  ...toDoctorResponse(doctor),
  mappingId: m.id,
  assignedAt: m.createdAt,
});
