import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';

export enum PoCategory {
  IT_EQUIPMENT = 'IT Equipment',
  OFFICE_SUPPLIES = 'Office Supplies',
  SOFTWARE_LICENSES = 'Software & Licenses',
  TRAVEL = 'Travel & Accommodation',
  CONSULTING = 'Consulting & Services',
  MARKETING = 'Marketing & Advertising',
  FACILITIES = 'Facilities & Maintenance',
  OTHER = 'Other',
}

export class CreatePoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsEnum(PoCategory)
  category!: PoCategory;
}
