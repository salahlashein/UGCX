import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_TTL?: string;

  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(15)
  BCRYPT_COST?: number;

  // ASM-P1-001: no real Paymob/Ably/R2 credentials exist in this
  // environment yet, so these stay optional here; local dev and CI run
  // against a mocked Paymob client and a local S3-compatible stand-in.
  @IsOptional()
  @IsString()
  PAYMOB_API_KEY?: string;

  @IsOptional()
  @IsString()
  PAYMOB_INTEGRATION_ID?: string;

  @IsOptional()
  @IsString()
  PAYMOB_IFRAME_ID?: string;

  // C1: PAYMOB_HMAC_SECRET is required in production only when Paymob is
  // enabled (PAYMOB_API_KEY is set). The V1 launch uses manual payments
  // and runs without Paymob. isValidPaymobSignature rejects every webhook
  // when the secret is empty, so a missing secret fails closed.
  @ValidateIf(
    (o: EnvironmentVariables) =>
      o.NODE_ENV === Environment.Production && !!o.PAYMOB_API_KEY,
  )
  @IsString()
  @IsNotEmpty()
  PAYMOB_HMAC_SECRET?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  PLATFORM_FEE_RATE?: number;

  @IsOptional()
  @IsString()
  ABLY_API_KEY?: string;

  @IsOptional()
  @IsString()
  R2_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  R2_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  R2_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  R2_BUCKET_NAME?: string;

  @IsOptional()
  @IsString()
  R2_PUBLIC_BASE_URL?: string;

  // Comma-separated list of allowed browser origins for CORS. Native
  // mobile clients do not send an Origin header and are unaffected by
  // this; it only matters for a browser-based client (the Expo web
  // preview today, a future website later).
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;
}

/**
 * Validates process.env against EnvironmentVariables before the app boots.
 * Called from ConfigModule.forRoot({ validate }) so a missing or malformed
 * variable fails fast, before the HTTP listener opens (EDGE-P1-002).
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  // A short JWT secret lets an attacker brute-force it and forge tokens.
  if (
    validatedConfig.NODE_ENV === Environment.Production &&
    validatedConfig.JWT_SECRET.length < 32
  ) {
    throw new Error(
      'Environment validation failed: JWT_SECRET must have at least 32 characters in production',
    );
  }

  return validatedConfig;
}
