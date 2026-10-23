import { toPageRequest, toPaginatedResponse } from '../../common/dto/pagination.dto';
import type { PaginatedResponseDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ConflictError, NotFoundError } from '../../common/errors/app-error';
import type { DoctorRepository } from '../doctors/doctor.repository';
import type { PatientRepository } from '../patients/patient.repository';
import { toAssignedDoctor, toMappingResponse, toPatientSummary } from './mapping.dto';
import type { CreateMappingDto, MappingResponseDto, PatientDoctorsResponseDto } from './mapping.dto';
import type { MappingRepository } from './mapping.repository';

export class MappingService {
  constructor(
    private readonly mappings: MappingRepository,
    private readonly patients: PatientRepository,
    private readonly doctors: DoctorRepository,
  ) {}

  async assign(ownerId: number, { patientId, doctorId }: CreateMappingDto): Promise<MappingResponseDto> {
    const [patient, doctor] = await Promise.all([
      this.patients.findByIdAndOwner(patientId, ownerId),
      this.doctors.findById(doctorId),
    ]);
    if (!patient) throw new NotFoundError('Patient');
    if (!doctor) throw new NotFoundError('Doctor');
    // The unique index still guards against a concurrent duplicate (mapped to 409 by the error handler).
    if (await this.mappings.exists(patientId, doctorId)) {
      throw new ConflictError('Doctor is already assigned to this patient');
    }
    return toMappingResponse(await this.mappings.create({ patientId, doctorId }));
  }

  async list(ownerId: number, query: PaginationQueryDto): Promise<PaginatedResponseDto<MappingResponseDto>> {
    const page = await this.mappings.findAllByOwner(ownerId, toPageRequest(query));
    return toPaginatedResponse(page, query, toMappingResponse);
  }

  async doctorsForPatient(ownerId: number, patientId: number): Promise<PatientDoctorsResponseDto> {
    const patient = await this.patients.findByIdAndOwner(patientId, ownerId);
    if (!patient) throw new NotFoundError('Patient');
    const mappings = await this.mappings.findAllByPatient(patientId);
    return {
      patient: toPatientSummary(patient),
      doctors: mappings.flatMap((m) => (m.doctor ? [toAssignedDoctor(m, m.doctor)] : [])),
    };
  }

  async remove(ownerId: number, id: number): Promise<void> {
    if (!(await this.mappings.findByIdAndOwner(id, ownerId))) throw new NotFoundError('Mapping');
    await this.mappings.deleteById(id);
  }
}
