import { IsNotEmpty, Matches } from 'class-validator';

export class StatusDto {
  @IsNotEmpty({ message: '状态不能为空' })
  @Matches(/^(0|1)$/, { message: '状态只能是 0 或 1' })
  status: string;
}
