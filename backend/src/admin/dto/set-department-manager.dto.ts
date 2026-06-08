import { IsUUID } from 'class-validator';

export class SetDepartmentManagerDto {
  @IsUUID()
  user_id!: string;

  @IsUUID()
  department_id!: string;
}