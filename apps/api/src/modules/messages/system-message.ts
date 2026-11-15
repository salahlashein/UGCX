export type SystemMessageEvent =
  | 'escrow_funded'
  | 'shipment_confirmed'
  | 'shipment_received'
  | 'deliverable_submitted'
  | 'revision_requested'
  | 'escrow_released';

export interface SystemMessagePayload {
  event: SystemMessageEvent;
  params: Record<string, string | number>;
}
