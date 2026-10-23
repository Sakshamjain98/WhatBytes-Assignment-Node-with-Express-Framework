import { toPageRequest, toPaginatedResponse } from '../../common/dto/pagination.dto';
import type { PaginatedResponseDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ForbiddenError, NotFoundError } from '../../common/errors/app-error';
import { toDoctorResponse } from './doctor.dto';
import type { CreateDoctorDto, DoctorResponseDto, UpdateDoctorDto } from './doctor.dto';
import type { DoctorRepository } from './doctor.repository';

/** Doctors are a shared directory: any user can read them, only the creator can modify them. */
export class DoctorService {
  constructor(private readonly doctors: DoctorRepository) {}

  async create(ownerId: number, dto: CreateDoctorDto): Promise<DoctorResponseDto> {
    return toDoctorResponse(await this.doctors.create({ ...dto, createdBy: ownerId }));
  }

  async list(query: PaginationQueryDto): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    return toPaginatedResponse(await this.doctors.findAll(toPageRequest(query)), query, toDoctorResponse);
  }

  async get(id: number): Promise<DoctorResponseDto> {
    const doctor = await this.doctors.findById(id);
    if (!doctor) throw new NotFoundError('Doctor');
    return toDoctorResponse(doctor);
  }

  async update(userId: number, id: number, dto: UpdateDoctorDto): Promise<DoctorResponseDto> {
    await this.assertCanModify(userId, id);
    const doctor = await this.doctors.updateById(id, dto);
    if (!doctor) throw new NotFoundError('Doctor');
    return toDoctorResponse(doctor);
  }

  async remove(userId: number, id: number): Promise<void> {
    await this.assertCanModify(userId, id);
    if (!(await this.doctors.deleteById(id))) throw new NotFoundError('Doctor');
  }

  private async assertCanModify(userId: number, id: number): Promise<void> {
    const doctor = await this.doctors.findById(id);
    if (!doctor) throw new NotFoundError('Doctor');
    if (doctor.createdBy !== userId) throw new ForbiddenError('Only the creator can modify this doctor');
  }
}
