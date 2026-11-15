import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageController } from './storage.controller';
import { R2StorageClient } from './r2-storage.client';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

describe('StorageController', () => {
  let controller: StorageController;
  let r2StorageClient: {
    createGenericUploadUrl: jest.Mock;
    createUploadUrl: jest.Mock;
    createReadUrl: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let collaborationsService: {
    findOwnedByCreator: jest.Mock;
    findOwnedByUser: jest.Mock;
  };
  let deliverablesRepository: {
    findOne: jest.Mock;
  };

  beforeEach(() => {
    r2StorageClient = {
      createGenericUploadUrl: jest.fn().mockResolvedValue({
        uploadUrl: 'https://r2.test/upload',
        fileUrl: 'https://r2.test/file.png',
      }),
      createUploadUrl: jest.fn().mockResolvedValue({
        uploadUrl: 'https://r2.test/upload/collab',
        fileUrl: 'https://r2.test/file.mp4',
      }),
      createReadUrl: jest.fn().mockResolvedValue('https://r2.test/read-url'),
    };
    configService = {
      get: jest.fn().mockReturnValue('500'),
    };
    collaborationsService = {
      findOwnedByCreator: jest.fn(),
      findOwnedByUser: jest.fn(),
    };
    deliverablesRepository = {
      findOne: jest.fn(),
    };
    controller = new StorageController(
      r2StorageClient as unknown as R2StorageClient,
      configService as unknown as ConfigService,
      collaborationsService as any,
      deliverablesRepository as any,
    );
  });

  it('brand_logo with image/png returns an upload URL', async () => {
    const result = await controller.requestUploadUrl({
      module: 'brand_logo',
      contentType: 'image/png',
      fileSize: 1024 * 1024,
    });

    expect(result.data.uploadUrl).toBe('https://r2.test/upload');
    expect(r2StorageClient.createGenericUploadUrl).toHaveBeenCalledWith(
      'brand_logo',
      'image/png',
      'png',
    );
  });

  it('brand_logo with application/pdf throws content_type_not_allowed_for_module', async () => {
    try {
      await controller.requestUploadUrl({
        module: 'brand_logo',
        contentType: 'application/pdf',
        fileSize: 1024 * 1024,
      });
      fail('Expected DomainErrorException');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DomainErrorException);
      const error = err as DomainErrorException;
      expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(error.getResponse()).toMatchObject({
        code: 'content_type_not_allowed_for_module',
      });
    }
  });

  it('brand_logo at 6 MB throws on the size cap', async () => {
    await expect(
      controller.requestUploadUrl({
        module: 'brand_logo',
        contentType: 'image/png',
        fileSize: 6 * 1024 * 1024,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deliverable with video/mp4 still returns an upload URL', async () => {
    r2StorageClient.createGenericUploadUrl.mockResolvedValueOnce({
      uploadUrl: 'https://r2.test/upload/video',
      fileUrl: 'https://r2.test/video.mp4',
    });

    const result = await controller.requestUploadUrl({
      module: 'deliverable',
      contentType: 'video/mp4',
      fileSize: 50 * 1024 * 1024,
    });

    expect(result.data.uploadUrl).toBe('https://r2.test/upload/video');
    expect(r2StorageClient.createGenericUploadUrl).toHaveBeenCalledWith(
      'deliverable',
      'video/mp4',
      'mp4',
    );
  });

  describe('requestCollaborationDeliverableUploadUrl (TASK-P3-04)', () => {
    it('1. returns a fileUrl that starts with the collaboration prefix', async () => {
      collaborationsService.findOwnedByCreator.mockResolvedValue({
        id: 'collab-1',
        status: 'shipped',
      });
      r2StorageClient.createUploadUrl.mockResolvedValue({
        uploadUrl: 'https://r2.test/upload/collab-1',
        fileUrl: 'https://r2.test/collaborations/collab-1/uuid.mp4',
      });

      const res = await controller.requestCollaborationDeliverableUploadUrl(
        { userId: 'creator-1', role: 'creator' } as any,
        'collab-1',
        { contentType: 'video/mp4', fileSize: 10 * 1024 * 1024 },
      );

      expect(res.data.fileUrl).toContain('/collaborations/collab-1/');
      expect(r2StorageClient.createUploadUrl).toHaveBeenCalledWith(
        'collab-1',
        'video/mp4',
        'mp4',
      );
    });

    it('2. rejects image/png', async () => {
      collaborationsService.findOwnedByCreator.mockResolvedValue({
        id: 'collab-1',
        status: 'shipped',
      });

      await expect(
        controller.requestCollaborationDeliverableUploadUrl(
          { userId: 'creator-1', role: 'creator' } as any,
          'collab-1',
          { contentType: 'image/png', fileSize: 1024 },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('3. rejects when collaboration is not shipped or revision_requested', async () => {
      collaborationsService.findOwnedByCreator.mockResolvedValue({
        id: 'collab-1',
        status: 'funded',
      });

      await expect(
        controller.requestCollaborationDeliverableUploadUrl(
          { userId: 'creator-1', role: 'creator' } as any,
          'collab-1',
          { contentType: 'video/mp4', fileSize: 1024 },
        ),
      ).rejects.toMatchObject({
        response: { code: 'invalid_state_transition' },
      });
    });
  });

  describe('getDeliverablePlayUrl (TASK-P3-04, DES-P3-303, SEC-303)', () => {
    it('4. returns signed read url with 900 seconds expiration', async () => {
      deliverablesRepository.findOne.mockResolvedValue({
        id: 'deliv-1',
        fileUrl: 'https://r2.test/collaborations/collab-1/video.mp4',
        collaboration: { id: 'collab-1' },
      });
      collaborationsService.findOwnedByUser.mockResolvedValue({
        id: 'collab-1',
      });
      r2StorageClient.createReadUrl.mockResolvedValue(
        'https://r2.test/signed-read-url',
      );

      const res = await controller.getDeliverablePlayUrl(
        { userId: 'user-1', role: 'brand' } as any,
        'deliv-1',
      );

      expect(res.data.url).toBe('https://r2.test/signed-read-url');
      expect(res.data.expiresInSeconds).toBe(900);
      expect(r2StorageClient.createReadUrl).toHaveBeenCalledWith(
        'https://r2.test/collaborations/collab-1/video.mp4',
        900,
      );
    });
  });
});
