import type { Request, Response } from 'express';
import type { TypedRequest } from '../../types/http';
import { idParamDto } from '../../common/dto/id-param.dto';
import { paginationQueryDto } from '../../common/dto/pagination.dto';
import { currentUserId } from '../../common/utils/current-user';
import type { CreateDoctorDto, UpdateDoctorDto } from './doctor.dto';
import type { DoctorService } from './doctor.service';

export class DoctorController {
  constructor(private readonly service: DoctorService) {}

  create = async (req: TypedRequest<CreateDoctorDto>, res: Response) => {
    res.status(201).json(await this.service.create(currentUserId(req), req.body));
  };

  list = async (req: Request, res: Response) => {
    res.json(await this.service.list(paginationQueryDto.parse(req.query)));
  };

  get = async (req: Request, res: Response) => {
    res.json(await this.service.get(idParamDto.parse(req.params).id));
  };

  update = async (req: TypedRequest<UpdateDoctorDto>, res: Response) => {
    res.json(await this.service.update(currentUserId(req), idParamDto.parse(req.params).id, req.body));
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(currentUserId(req), idParamDto.parse(req.params).id);
    res.status(204).end();
  };
}
