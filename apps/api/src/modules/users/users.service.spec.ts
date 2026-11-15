import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User, UserLocale } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    update: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    usersRepository = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('updatePushToken (feature_mobile_app_phase1 addendum)', () => {
    it('persists the Expo push token for the given user', async () => {
      await service.updatePushToken('user-1', 'ExponentPushToken[abc123]');

      expect(usersRepository.update).toHaveBeenCalledWith('user-1', {
        expoPushToken: 'ExponentPushToken[abc123]',
      });
    });
  });

  describe('clearPushToken (TASK-P4-06, REQ-405)', () => {
    it('clears the Expo push token for the given user', async () => {
      await service.clearPushToken('user-1');

      expect(usersRepository.update).toHaveBeenCalledWith('user-1', {
        expoPushToken: null,
      });
    });
  });

  describe('getMe (BG-39, TASK-W4-09)', () => {
    it('returns user me response', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'brand',
        displayName: 'Test User',
        locale: UserLocale.AR,
      });

      const res = await service.getMe('user-1');
      expect(res).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'brand',
        displayName: 'Test User',
        locale: UserLocale.AR,
      });
    });
  });

  describe('updateMe (BG-39, TASK-W4-09)', () => {
    it('updates display name and preferred language', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'brand',
        displayName: 'Old Name',
        locale: UserLocale.EN,
      };
      usersRepository.findOne.mockResolvedValue(user);

      const res = await service.updateMe('user-1', {
        displayName: 'New Name',
        locale: UserLocale.AR,
      });

      expect(res.displayName).toBe('New Name');
      expect(res.locale).toBe(UserLocale.AR);
      expect(usersRepository.save).toHaveBeenCalled();
    });
  });
});
