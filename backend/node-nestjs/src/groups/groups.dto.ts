import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class AddChildGroupDto {
  @IsString()
  @IsNotEmpty({ message: '分组ID不能为空' })
  @Matches(/^[0-9]{2,}$/, { message: '组织编码只能包含数字' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: '分组名称不能为空' })
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class EditGroupDto {
  @IsString()
  @IsNotEmpty({ message: '组织名称不能为空' })
  name: string;

  @IsOptional()
  @Matches(/^[01]$/, { message: '状态只能是 0 或 1' })
  status?: string;
}

export class QueryGroupDto {
  @IsOptional()
  @Matches(/^$|^[A-Za-z0-9]+$/, { message: '只能包含数字和大小写字母' })
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(/^$|^(0|1|all)$/, { message: '只能是 0、1 或 all' })
  status?: string;
}
