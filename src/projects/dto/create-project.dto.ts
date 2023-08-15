import { IsString, MinLength, IsOptional, IsArray } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  description: string;

  @IsString({ each: true }) // each en true obliga a que sean strings
  @IsArray()
  @IsOptional()
  tags: string[];

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  images?: string[];
}
