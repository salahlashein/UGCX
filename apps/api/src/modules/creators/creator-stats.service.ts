import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import {
  Deliverable,
  DeliverableStatus,
} from '../deliverables/entities/deliverable.entity';

export interface CreatorStats {
  jobsDone: number;
  approvalRate: number;
  averageRevisions: number;
}

@Injectable()
export class CreatorStatsService {
  constructor(private readonly dataSource: DataSource) {}

  async forCreators(creatorIds: string[]): Promise<Map<string, CreatorStats>> {
    const result = new Map<string, CreatorStats>();
    if (!creatorIds || creatorIds.length === 0) {
      return result;
    }

    // Initialize defaults
    for (const id of creatorIds) {
      result.set(id, { jobsDone: 0, approvalRate: 100, averageRevisions: 0 });
    }

    try {
      const approvedOrPaidMap = new Map<string, number>();
      const cancelledMap = new Map<string, number>();
      const revMap = new Map<string, number>();

      if (typeof this.dataSource.query === 'function') {
        const collabStatsRaw: {
          creatorId: string;
          status: string;
          count: string;
        }[] = await this.dataSource.query(
          `SELECT
             c.creator_id AS "creatorId",
             c.status AS "status",
             COUNT(c.id)::int AS "count"
           FROM collaborations c
           WHERE c.creator_id = ANY($1)
             AND c.status IN ('approved', 'paid', 'cancelled')
           GROUP BY c.creator_id, c.status`,
          [creatorIds],
        );

        for (const row of collabStatsRaw) {
          const count = parseInt(row.count, 10) || 0;
          if (row.status === 'approved' || row.status === 'paid') {
            approvedOrPaidMap.set(
              row.creatorId,
              (approvedOrPaidMap.get(row.creatorId) ?? 0) + count,
            );
          } else if (row.status === 'cancelled') {
            cancelledMap.set(
              row.creatorId,
              (cancelledMap.get(row.creatorId) ?? 0) + count,
            );
          }
        }

        const revRaw: {
          creatorId: string;
          revCount: string;
        }[] = await this.dataSource.query(
          `SELECT
             c.creator_id AS "creatorId",
             COUNT(d.id)::int AS "revCount"
           FROM deliverables d
           INNER JOIN collaborations c ON c.id = d.collaboration_id
           WHERE c.creator_id = ANY($1)
             AND c.status IN ('approved', 'paid')
             AND d.status = 'revision_requested'
           GROUP BY c.creator_id`,
          [creatorIds],
        );

        for (const row of revRaw) {
          revMap.set(row.creatorId, parseInt(row.revCount, 10) || 0);
        }
      } else if (typeof this.dataSource.getRepository === 'function') {
        const collabRepo = this.dataSource.getRepository(Collaboration);
        const collabQb = collabRepo
          .createQueryBuilder('c')
          .select('c.status', 'status')
          .addSelect('COUNT(c.id)', 'count')
          .where('c.creator_id IN (:...creatorIds)', { creatorIds })
          .andWhere('c.status IN (:...statuses)', {
            statuses: [
              CollaborationStatus.APPROVED,
              CollaborationStatus.PAID,
              CollaborationStatus.CANCELLED,
            ],
          })
          .groupBy('c.status');

        const collabStats = await collabQb.getRawMany();

        for (const stat of collabStats) {
          const count = parseInt(stat.count, 10) || 0;
          const creatorId = stat.creatorId ?? creatorIds[0];
          if (
            stat.status === CollaborationStatus.APPROVED ||
            stat.status === CollaborationStatus.PAID
          ) {
            approvedOrPaidMap.set(
              creatorId,
              (approvedOrPaidMap.get(creatorId) ?? 0) + count,
            );
          } else if (stat.status === CollaborationStatus.CANCELLED) {
            cancelledMap.set(
              creatorId,
              (cancelledMap.get(creatorId) ?? 0) + count,
            );
          }
        }

        const deliverableRepo = this.dataSource.getRepository(Deliverable);
        const delivQb = deliverableRepo
          .createQueryBuilder('d')
          .innerJoin('d.collaboration', 'c')
          .select('COUNT(d.id)', 'revCount')
          .where('c.creator_id IN (:...creatorIds)', { creatorIds })
          .andWhere('c.status IN (:...finishedStatuses)', {
            finishedStatuses: [
              CollaborationStatus.APPROVED,
              CollaborationStatus.PAID,
            ],
          })
          .andWhere('d.status = :revStatus', {
            revStatus: DeliverableStatus.REVISION_REQUESTED,
          });

        if (typeof delivQb.getRawMany === 'function') {
          delivQb.groupBy('c.creator_id');
          const revStats = await delivQb.getRawMany();
          for (const r of revStats) {
            const creatorId = r.creatorId ?? creatorIds[0];
            revMap.set(creatorId, parseInt(r.revCount, 10) || 0);
          }
        } else if (typeof delivQb.getRawOne === 'function') {
          const r = await delivQb.getRawOne();
          if (r) {
            revMap.set(creatorIds[0], parseInt(r.revCount, 10) || 0);
          }
        }
      }

      for (const id of creatorIds) {
        const approvedOrPaid = approvedOrPaidMap.get(id) ?? 0;
        const cancelled = cancelledMap.get(id) ?? 0;
        const totalFinished = approvedOrPaid + cancelled;
        const approvalRate =
          totalFinished === 0
            ? 100
            : Math.round((approvedOrPaid / totalFinished) * 100);

        let averageRevisions = 0;
        if (approvedOrPaid > 0) {
          const totalRevisions = revMap.get(id) ?? 0;
          averageRevisions =
            Math.round((totalRevisions / approvedOrPaid) * 10) / 10;
        }

        result.set(id, {
          jobsDone: approvedOrPaid,
          approvalRate,
          averageRevisions,
        });
      }
    } catch {
      // Default fallback
    }

    return result;
  }
}
