import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApprovePoDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
