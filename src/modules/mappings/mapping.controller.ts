import type { Request, Response } from 'express';
import type { TypedRequest } from '../../types/http';
import { idParamDto } from '../../common/dto/id-param.dto';
import { paginationQueryDto } from '../../common/dto/pagination.dto';
import { currentUserId } from '../../common/utils/current-user';
import { patientIdParamDto } from './mapping.dto';
import type { CreateMappingDto } from './mapping.dto';
import type { MappingService } from './mapping.service';

export class MappingController {
  constructor(private readonly service: MappingService) {}

  assign = async (req: TypedRequest<CreateMappingDto>, res: Response) => {
    res.status(201).json(await this.service.assign(currentUserId(req), req.body));
  };

  list = async (req: Request, res: Response) => {
    res.json(await this.service.list(currentUserId(req), paginationQueryDto.parse(req.query)));
  };

  doctorsForPatient = async (req: Request, res: Response) => {
    const { patientId } = patientIdParamDto.parse(req.params);
    res.json(await this.service.doctorsForPatient(currentUserId(req), patientId));
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(currentUserId(req), idParamDto.parse(req.params).id);
    res.status(204).end();
  };
}
