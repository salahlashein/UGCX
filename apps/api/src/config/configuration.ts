export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  bcryptCost: number;
  paymob: {
    apiKey: string;
    integrationId: string;
    iframeId: string;
    hmacSecret: string;
  };
  platformFeeRate: number;
  ably: {
    apiKey: string;
  };
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicBaseUrl: string;
  };
  campaignDefaultOpenDays: number;
  reportingTimeZone: string;
  otp: {
    ttlSeconds: number;
    maxAttempts: number;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
  bcryptCost: parseInt(process.env.BCRYPT_COST ?? '12', 10),
  paymob: {
    apiKey: process.env.PAYMOB_API_KEY ?? '',
    integrationId: process.env.PAYMOB_INTEGRATION_ID ?? '',
    iframeId: process.env.PAYMOB_IFRAME_ID ?? '',
    hmacSecret: process.env.PAYMOB_HMAC_SECRET ?? '',
  },
  platformFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE ?? '0.10'),
  ably: {
    apiKey: process.env.ABLY_API_KEY ?? '',
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucketName: process.env.R2_BUCKET_NAME || 'ugcx-deliverables',
    // M4: the public/CDN domain the brand's browser actually fetches a
    // deliverable from; distinct from the private R2 S3 API endpoint used
    // to presign the upload.
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? '',
  },
  campaignDefaultOpenDays: parseInt(
    process.env.CAMPAIGN_DEFAULT_OPEN_DAYS ?? '14',
    10,
  ),
  reportingTimeZone: process.env.REPORTING_TIME_ZONE ?? 'Africa/Cairo',
  otp: {
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '600', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
  },
});
