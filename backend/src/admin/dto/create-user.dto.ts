import { IsEmail, IsString, IsNotEmpty, IsOptional, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  role_codes?: string[];
}
