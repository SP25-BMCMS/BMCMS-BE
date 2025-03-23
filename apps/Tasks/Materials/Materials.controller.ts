import { Controller, Param } from '@nestjs/common';
import {  MaterialsService} from './Materials.service';
@Controller('materials')
export class MaterialsController {

  constructor(private MaterialsService: MaterialsService) { }

}
