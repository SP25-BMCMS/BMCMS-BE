import { Controller } from '@nestjs/common'
import { ResidentsService } from './residents.service'
import { GrpcMethod } from '@nestjs/microservices'

@Controller()
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) { }

}
