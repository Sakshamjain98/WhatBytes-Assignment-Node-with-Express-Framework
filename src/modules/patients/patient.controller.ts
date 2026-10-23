import type { Request, Response } from 'express';
import type { TypedRequest } from '../../types/http';
import { idParamDto } from '../../common/dto/id-param.dto';
import { paginationQueryDto } from '../../common/dto/pagination.dto';
import { currentUserId } from '../../common/utils/current-user';
import type { CreatePatientDto, UpdatePatientDto } from './patient.dto';
import type { PatientService } from './patient.service';

export class PatientController {
  constructor(private readonly service: PatientService) {}

  create = async (req: TypedRequest<CreatePatientDto>, res: Response) => {
    res.status(201).json(await this.service.create(currentUserId(req), req.body));
  };

  list = async (req: Request, res: Response) => {
    res.json(await this.service.list(currentUserId(req), paginationQueryDto.parse(req.query)));
  };

  get = async (req: Request, res: Response) => {
    res.json(await this.service.get(currentUserId(req), idParamDto.parse(req.params).id));
  };

  update = async (req: TypedRequest<UpdatePatientDto>, res: Response) => {
    res.json(await this.service.update(currentUserId(req), idParamDto.parse(req.params).id, req.body));
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(currentUserId(req), idParamDto.parse(req.params).id);
    res.status(204).end();
  };
}
