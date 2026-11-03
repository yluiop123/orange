import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @Matches(/^[A-Za-z0-9_]{4,50}$/, {
    message: '只能包含字母、数字和下划线，且长度需为 4-50 之间',
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '原密码不能为空' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @Length(8, 64, { message: '新密码长度需为 8-64 之间' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/, { message: '新密码需同时包含字母和数字' })
  newPassword: string;
}
