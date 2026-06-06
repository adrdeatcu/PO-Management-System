import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @IsUUID()
  @IsNotEmpty()
  role_id!: string;
}
