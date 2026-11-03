import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class AddRoleDto {
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  @Length(2, 50, { message: '角色名称长度需为 2-50 之间' })
  name: string;

  @IsOptional()
  @Matches(/^$|^[A-Za-z0-9_-]{2,32}$/, {
    message: '角色ID只能包含字母、数字、下划线和中划线',
  })
  id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class EditRoleDto {
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: '角色名称长度需为 2-50 之间' })
  name?: string;

  @IsOptional()
  @Matches(/^(0|1)$/, { message: '状态只能是 0 或 1' })
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class QueryRoleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @Matches(/^$|^(asc|desc)$/, { message: '排序方向只能是 asc 或 desc' })
  direction?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码不能小于 1' })
  @Max(10000, { message: '页码不能超过 10000' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量不能小于 1' })
  @Max(100, { message: '每页数量不能超过 100' })
  size?: number = 10;
}
