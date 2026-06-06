import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PoStatusFilter {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING_MANAGER = 'pending_manager',
  PENDING_IT = 'pending_it',
  PENDING_FINANCE = 'pending_finance',
  APPROVED = 'approved',
  NEEDS_REWORK = 'needs_rework',
  COMPLETED = 'completed',
}

export class QueryPoDto {
  @IsOptional()
  @IsEnum(PoStatusFilter)
  status?: PoStatusFilter;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  limit?: number = 20;
}
