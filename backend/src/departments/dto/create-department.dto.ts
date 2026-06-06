import { IsString, IsNotEmpty, IsOptional, IsUUID, Length } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsUUID()
  manager_user_id?: string;
}