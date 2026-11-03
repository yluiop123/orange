import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class AddUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户姓名不能为空' })
  @Length(2, 50, { message: '用户姓名长度需为 2-50 之间' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(4, 50, { message: '用户名长度需为 4-50 之间' })
  @Matches(/^[A-Za-z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '用户组不能为空' })
  groupId: string;

  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsOptional()
  @Matches(/^(0|1)$/, { message: '状态只能是 0 或 1' })
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class EditUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: '用户姓名长度需为 2-50 之间' })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(4, 50, { message: '用户名长度需为 4-50 之间' })
  @Matches(/^[A-Za-z0-9_]{4,50}$/, { message: '用户名只能包含字母、数字和下划线' })
  username?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_object, value) => value !== '')
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @Matches(/^(0|1)$/, { message: '状态只能是 0 或 1' })
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class QueryUserDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Matches(/^$|^(0|1|all)$/, { message: '状态只能是 0、1 或 all' })
  status?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

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
