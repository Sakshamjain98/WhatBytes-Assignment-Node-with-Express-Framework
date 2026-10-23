import { toPageRequest, toPaginatedResponse } from '../../common/dto/pagination.dto';
import type { PaginatedResponseDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { NotFoundError } from '../../common/errors/app-error';
import { toPatientResponse } from './patient.dto';
import type { CreatePatientDto, PatientResponseDto, UpdatePatientDto } from './patient.dto';
import type { PatientRepository } from './patient.repository';

export class PatientService {
  constructor(private readonly patients: PatientRepository) {}

  async create(ownerId: number, dto: CreatePatientDto): Promise<PatientResponseDto> {
    return toPatientResponse(await this.patients.create({ ...dto, createdBy: ownerId }));
  }

  async list(ownerId: number, query: PaginationQueryDto): Promise<PaginatedResponseDto<PatientResponseDto>> {
    const page = await this.patients.findAllByOwner(ownerId, toPageRequest(query));
    return toPaginatedResponse(page, query, toPatientResponse);
  }

  async get(ownerId: number, id: number): Promise<PatientResponseDto> {
    const patient = await this.patients.findByIdAndOwner(id, ownerId);
    if (!patient) throw new NotFoundError('Patient');
    return toPatientResponse(patient);
  }

  async update(ownerId: number, id: number, dto: UpdatePatientDto): Promise<PatientResponseDto> {
    const patient = await this.patients.updateByIdAndOwner(id, ownerId, dto);
    if (!patient) throw new NotFoundError('Patient');
    return toPatientResponse(patient);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    if (!(await this.patients.deleteByIdAndOwner(id, ownerId))) throw new NotFoundError('Patient');
  }
}
