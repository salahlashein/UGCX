'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { ChatWorkspace } from '../../../components/chat/ChatWorkspace';

export default function CreatorChatsPage() {
  return (
    <AppShell requiredRole="creator">
      <ChatWorkspace role="creator" />
    </AppShell>
  );
}
