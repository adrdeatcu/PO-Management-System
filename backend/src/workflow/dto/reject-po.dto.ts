import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectPoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}
