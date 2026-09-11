import { IsString, MaxLength, MinLength } from 'class-validator';

/** REQ-006 */
export class ConfirmShipmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  carrier: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  trackingNumber: string;
}
