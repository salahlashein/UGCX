import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: { update: jest.Mock };

  beforeEach(async () => {
    usersRepository = { update: jest.fn().mockResolvedValue({ affected: 1 }) };

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
});
