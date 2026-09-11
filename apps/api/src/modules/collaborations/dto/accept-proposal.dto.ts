/**
 * REQ-001: the accept-proposal endpoint takes no request fields (everything
 * it needs comes from the proposal itself and the authenticated brand).
 * Declared explicitly so the global ValidationPipe rejects an unexpected
 * body instead of silently ignoring it.
 */
export class AcceptProposalDto {}
