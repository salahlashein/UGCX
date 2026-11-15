import { ValidationPipe, ArgumentMetadata } from '@nestjs/common';
import { CreateCampaignDto } from './create-campaign.dto';
import { VideoType } from '../entities/campaign.entity';
import { Language } from '../../../common/enums/language.enum';

describe('CreateCampaignDto', () => {
  let target: ValidationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateCampaignDto,
    data: '',
  };

  beforeEach(() => {
    target = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it('successfully validates and transforms brief payload with string numbers', async () => {
    const payload = {
      title: 'running shoe',
      videoType: 'try_on',
      durationSeconds: 60,
      language: 'ar',
      budgetMin: '500.00',
      budgetMax: '1500.00',
      needsShipping: true,
    };

    const transformed = (await target.transform(
      payload,
      metadata,
    )) as CreateCampaignDto;

    expect(transformed.title).toBe('running shoe');
    expect(transformed.videoType).toBe(VideoType.TRY_ON);
    expect(transformed.durationSeconds).toBe(60);
    expect(transformed.language).toBe(Language.AR);
    expect(transformed.budgetMin).toBe(500);
    expect(transformed.budgetMax).toBe(1500);
    expect(transformed.needsShipping).toBe(true);
  });

  it('still supports bare minimal creation with title or productId', async () => {
    const payload = {
      title: 'running shoe',
    };

    const transformed = (await target.transform(
      payload,
      metadata,
    )) as CreateCampaignDto;

    expect(transformed.title).toBe('running shoe');
  });

  it('rejects unknown properties due to forbidNonWhitelisted', async () => {
    const payload = {
      title: 'running shoe',
      unknownProperty: 123,
    };

    await expect(target.transform(payload, metadata)).rejects.toThrow();
  });
});
