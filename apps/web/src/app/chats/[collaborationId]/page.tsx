'use client';

import React, { use } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { ChatWorkspace } from '../../../components/chat/ChatWorkspace';
import { useAuthStore } from '../../../store/authStore';

export default function CollaborationChatPage({
  params,
}: {
  params: Promise<{ collaborationId: string }>;
}) {
  const { collaborationId } = use(params);
  const user = useAuthStore((s) => s.user);
  const role = user?.role === 'creator' ? 'creator' : 'brand';

  return (
    <AppShell requiredRole={role}>
      <ChatWorkspace initialCollaborationId={collaborationId} role={role} />
    </AppShell>
  );
}
