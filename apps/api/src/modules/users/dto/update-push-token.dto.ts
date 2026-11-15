import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class UpdatePushTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/, {
    message: 'Invalid Expo push token format',
  })
  expoPushToken: string;
}
