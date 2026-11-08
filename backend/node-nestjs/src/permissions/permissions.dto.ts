import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';

const LOCALE_KEY = /^[a-z]{2}(-[A-Za-z]{2})?$/;
const TRANSLATION_NAME_MAX_LENGTH = 255;

function isValidTranslations(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.entries(value).every(
    ([locale, name]) =>
      LOCALE_KEY.test(locale) &&
      typeof name === 'string' &&
      name.trim().length > 0 &&
      name.length <= TRANSLATION_NAME_MAX_LENGTH,
  );
}

function IsTranslations(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isTranslations',
      validator: {
        validate: isValidTranslations,
        defaultMessage: () =>
          'translations 必须是 locale 到非空名称的对象，locale 形如 zh-CN，名称不超过 255 个字符',
      },
    },
    validationOptions,
  );
}

const TRANSLATIONS_METADATA = {
  description: '按 locale 的权限名称；缺失时回退到 name',
  type: 'object' as const,
  additionalProperties: { type: 'string' as const },
  example: { 'en-US': 'User management' },
};

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

  @ApiPropertyOptional(TRANSLATIONS_METADATA)
  @IsOptional()
  @IsTranslations()
  translations?: Record<string, string>;
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

  @ApiPropertyOptional(TRANSLATIONS_METADATA)
  @IsOptional()
  @IsTranslations()
  translations?: Record<string, string>;
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
