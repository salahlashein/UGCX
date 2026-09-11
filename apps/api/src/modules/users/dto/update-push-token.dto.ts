import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdatePushTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  expoPushToken: string;
}
