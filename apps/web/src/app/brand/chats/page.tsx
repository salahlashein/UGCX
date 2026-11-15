'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { ChatWorkspace } from '../../../components/chat/ChatWorkspace';

export default function BrandChatsPage() {
  return (
    <AppShell requiredRole="brand">
      <ChatWorkspace role="brand" />
    </AppShell>
  );
}
