import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class AddChildPermissionDto {
  @IsString()
  @IsNotEmpty({ message: '权限编码不能为空' })
  @Matches(/^[0-9]{2,}$/, { message: '权限编码只能包含数字' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: '权限名称不能为空' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '权限路径不能为空' })
  path: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsString()
  @IsNotEmpty({ message: '权限类型不能为空' })
  @Matches(/^(menu|action|directory)$/, { message: '权限类型只能是 menu、action 或 directory' })
  type: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class EditPermissionDto {
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: '权限名称长度需为 2-50 之间' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '权限路径长度不能超过 200' })
  path?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @Matches(/^(0|1)$/, { message: '状态只能是 0 或 1' })
  status?: string;

  @IsOptional()
  @Matches(/^(menu|action|directory)$/, { message: '权限类型只能是 menu、action 或 directory' })
  type?: string;
}

export class QueryPermissionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @Matches(/^$|^(0|1|all)$/, { message: '状态只能是 0、1 或 all' })
  status?: string;

  @IsOptional()
  @Matches(/^$|^(menu|directory|action|all)$/, {
    message: '权限类型只能是 menu、directory、action 或 all',
  })
  type?: string;
}
