import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Creator } from './creator.entity';

export enum PortfolioMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('creator_portfolio_items')
export class CreatorPortfolioItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'creator_id' })
  creatorId: string;

  @ManyToOne(() => Creator, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: Creator;

  @Column({ name: 'media_url' })
  mediaUrl: string;

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: PortfolioMediaType,
    enumName: 'creator_portfolio_items_media_type_enum',
  })
  mediaType: PortfolioMediaType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
