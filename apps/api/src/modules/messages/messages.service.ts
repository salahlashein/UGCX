import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Ably from 'ably';
import { Message } from './entities/message.entity';
import { AblyTokenService } from './ably-token.service';
import { ChatProviderError } from './chat-provider.error';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

/** TASK-P1-009 */
@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly collaborationsService: CollaborationsService,
    private readonly ablyTokenService: AblyTokenService,
  ) {}

  /** REQ-011/EDGE-P1-006 */
  async createChatToken(
    user: AuthUser,
    collaborationId: string,
  ): Promise<Ably.TokenRequest> {
    const collaboration = await this.requireEligibleParticipant(
      user,
      collaborationId,
    );
    try {
      return await this.ablyTokenService.createTokenForCollaboration(
        user.userId,
        collaboration.id,
      );
    } catch (error) {
      if (error instanceof ChatProviderError) {
        throw new DomainErrorException(
          HttpStatus.BAD_GATEWAY,
          'chat_provider_error',
          'Chat service is unavailable, please try again',
        );
      }
      throw error;
    }
  }

  async list(
    user: AuthUser,
    collaborationId: string,
    page: number,
    perPage: number,
  ): Promise<[Message[], number]> {
    await this.requireEligibleParticipant(user, collaborationId);
    return this.messagesRepository.findAndCount({
      where: { collaborationId },
      order: { sentAt: 'ASC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  async create(
    user: AuthUser,
    collaborationId: string,
    body: string,
  ): Promise<Message> {
    await this.requireEligibleParticipant(user, collaborationId);
    const message = this.messagesRepository.create({
      collaborationId,
      senderUserId: user.userId,
      body,
    });
    const saved = await this.messagesRepository.save(message);
    this.logger.log(
      `Message ${saved.id} posted to collaboration ${collaborationId}`,
    );
    return saved;
  }

  private async requireEligibleParticipant(
    user: AuthUser,
    collaborationId: string,
  ) {
    const collaboration = await this.collaborationsService.requireParticipant(
      user,
      collaborationId,
    );
    if (!this.collaborationsService.isChatEligible(collaboration)) {
      throw new DomainErrorException(
        HttpStatus.FORBIDDEN,
        'chat_not_available',
        'Chat opens once the collaboration is funded',
      );
    }
    return collaboration;
  }
}
