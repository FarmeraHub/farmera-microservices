import { PartialType } from '@nestjs/mapped-types';
import { CreateStepDiaryDto } from './create-step-diary.dto';

export class UpdateStepDiaryDto extends PartialType(CreateStepDiaryDto) {}
