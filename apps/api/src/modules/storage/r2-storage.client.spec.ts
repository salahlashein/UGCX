import { ConfigService } from '@nestjs/config';
import { R2StorageClient } from './r2-storage.client';

/**
 * Public files (logos, portfolio, product images) go to the public assets
 * bucket; deliverables, verification clips and business documents stay in
 * the private bucket, which only serves short-lived signed URLs.
 */
describe('R2StorageClient bucket routing', () => {
  const PRIVATE_BASE = 'https://private.reelpal.test';
  const ASSETS_BASE = 'https://assets.reelpal.test';

  function makeClient(r2: Record<string, string>): R2StorageClient {
    const config = {
      accountId: 'acct',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      bucketName: 'reelpal-deliverables',
      publicBaseUrl: PRIVATE_BASE,
      assetsBucketName: '',
      assetsPublicBaseUrl: '',
      ...r2,
    };
    const configService = {
      get: (key: string) => (key === 'r2' ? config : config.publicBaseUrl),
    } as unknown as ConfigService;
    return new R2StorageClient(configService as never);
  }

  const withAssets = () =>
    makeClient({
      assetsBucketName: 'reelpal-public',
      assetsPublicBaseUrl: `${ASSETS_BASE}/`,
    });

  it.each(['brand_logo', 'portfolio', 'product'])(
    'puts %s in the public assets bucket',
    async (module) => {
      const { uploadUrl, fileUrl } = await withAssets().createGenericUploadUrl(
        module,
        'image/png',
        'png',
      );
      expect(fileUrl.startsWith(`${ASSETS_BASE}/${module}/`)).toBe(true);
      expect(uploadUrl).toContain('reelpal-public');
    },
  );

  it.each(['brand_document', 'verification', 'deliverable'])(
    'keeps %s in the private bucket',
    async (module) => {
      const { uploadUrl, fileUrl } = await withAssets().createGenericUploadUrl(
        module,
        'video/mp4',
        'mp4',
      );
      expect(fileUrl.startsWith(`${PRIVATE_BASE}/${module}/`)).toBe(true);
      expect(uploadUrl).toContain('reelpal-deliverables');
    },
  );

  it('keeps collaboration deliverables in the private bucket', async () => {
    const { uploadUrl, fileUrl } = await withAssets().createUploadUrl(
      'collab-1',
      'video/mp4',
      'mp4',
    );
    expect(fileUrl.startsWith(`${PRIVATE_BASE}/collaborations/collab-1/`)).toBe(
      true,
    );
    expect(uploadUrl).toContain('reelpal-deliverables');
  });

  it('tells asset URLs and private file URLs apart', () => {
    const client = withAssets();
    expect(client.isAssetUrl(`${ASSETS_BASE}/brand_logo/a.png`)).toBe(true);
    expect(client.isAssetUrl(`${PRIVATE_BASE}/brand_logo/a.png`)).toBe(false);
    expect(
      client.isPrivateFileUrl(`${PRIVATE_BASE}/brand_document/a.pdf`),
    ).toBe(true);
    expect(client.isPrivateFileUrl(`${ASSETS_BASE}/brand_document/a.pdf`)).toBe(
      false,
    );
  });

  it('falls back to the private bucket when the assets bucket is not set', async () => {
    const client = makeClient({});
    const { fileUrl } = await client.createGenericUploadUrl(
      'brand_logo',
      'image/png',
      'png',
    );
    expect(fileUrl.startsWith(`${PRIVATE_BASE}/brand_logo/`)).toBe(true);
    expect(client.isAssetUrl(fileUrl)).toBe(true);
  });
});
