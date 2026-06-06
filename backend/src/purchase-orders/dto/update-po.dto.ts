import { IsString, IsOptional, IsNumber, IsPositive, IsEnum, MaxLength } from 'class-validator';
import { PoCategory } from './create-po.dto';

export class UpdatePoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsEnum(PoCategory)
  category?: PoCategory;
}
