'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Message } from '@ugcx/shared-types';
import {
  AppText,
  Button,
  Card,
  FilterChip,
  Icon,
  ListRow,
  QueryStateView,
  SplitPane,
  StatusBadge,
  Tag,
  TextInput,
} from '../ui';
import { colors, radius, spacing } from '../../theme/tokens';
import { useChats, useMarkChatRead } from '../../hooks/api/useChats';
import { useMessages, useSendMessage } from '../../hooks/api/useMessages';
import { useCollaboration } from '../../hooks/api/useCollaborations';
import { useMe } from '../../hooks/api/useMe';
import { useBrandProfile } from '../../hooks/api/useBrand';
import { extractErrorMessage } from '../../services/apiHelpers';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n';
import { formatDateShort, formatMoney, getInitials } from '../../utils/format';

interface ChatWorkspaceProps {
  initialCollaborationId?: string;
  role: 'brand' | 'creator';
}

export function ChatWorkspace({ initialCollaborationId, role }: ChatWorkspaceProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const user = useAuthStore((s) => s.user);
  // Names for the page title: the brand name for a brand, the first name for a creator.
  const brandName = useBrandProfile().data?.companyName?.trim() || null;
  const firstName = useMe().data?.displayName?.trim().split(/\s+/)[0] || null;

  const chatsQuery = useChats();
  const markRead = useMarkChatRead();

  const [selectedCollabId, setSelectedCollabId] = useState<string | undefined>(
    initialCollaborationId,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'active' | 'closed'>('active');
  const [messageText, setMessageText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  // Phones show the list or one conversation. A deep link opens the conversation directly.
  const [isThreadOpen, setIsThreadOpen] = useState(Boolean(initialCollaborationId));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const threads = chatsQuery.data?.data || [];

  // Update selected thread if initialCollaborationId changes
  useEffect(() => {
    if (initialCollaborationId) {
      setSelectedCollabId(initialCollaborationId);
    } else if (!selectedCollabId && threads.length > 0) {
      setSelectedCollabId(threads[0].collaborationId);
    }
  }, [initialCollaborationId, threads, selectedCollabId]);

  // Mark read when thread changes
  useEffect(() => {
    if (selectedCollabId) {
      markRead.mutate(selectedCollabId);
    }
  }, [selectedCollabId]);

  // Fetch active messages and thread details
  const messagesQuery = useMessages(selectedCollabId);
  const sendMessage = useSendMessage(selectedCollabId || '');
  const collabQuery = useCollaboration(selectedCollabId);

  const messages = messagesQuery.data?.data || [];

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Filter threads by search and active/closed
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const isClosed =
        t.collaborationStatus === 'approved' ||
        t.collaborationStatus === 'paid' ||
        t.collaborationStatus === 'cancelled';
      if (filterState === 'active' && isClosed) return false;
      if (filterState === 'closed' && !isClosed) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const otherParty = (t.counterpartName || '').toLowerCase();
        const briefTitle = (t.campaignTitle || '').toLowerCase();
        return otherParty.includes(q) || briefTitle.includes(q);
      }
      return true;
    });
  }, [threads, filterState, searchQuery]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.collaborationId === selectedCollabId);
  }, [threads, selectedCollabId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedCollabId) return;
    const body = messageText.trim();
    setSendError(null);
    setMessageText('');
    try {
      await sendMessage.mutateAsync({ body });
      messagesQuery.refetch();
      chatsQuery.refetch();
    } catch (err) {
      // Give the text back so the user does not lose the message.
      setMessageText(body);
      setSendError(
        extractErrorMessage(
          err,
          locale === 'ar' ? 'تعذر إرسال الرسالة. حاول مرة أخرى.' : 'Message not sent. Try again.',
        ),
      );
    }
  };

  const openThread = (collaborationId: string) => {
    setSelectedCollabId(collaborationId);
    setIsThreadOpen(true);
    setSendError(null);
  };

  /**
   * Copy for one system event key, in the current language. The counterpart
   * is the other side of the chat, so events can name the real person.
   */
  const systemEventLabel = (eventKey: string, counterpart?: string | null): string | null => {
    const other = counterpart?.trim() || null;
    if (eventKey === 'shipment_confirmed') {
      return locale === 'ar' ? 'تم تأكيد شحن عينة المنتج' : 'Product shipment marked sent';
    }
    if (eventKey === 'escrow_funded') {
      return locale === 'ar' ? 'تم سداد وتأمين رصيد الضمان' : 'Campaign escrow funded';
    }
    if (eventKey === 'escrow_released') {
      return locale === 'ar'
        ? 'تم اعتماد المخرج والإفراج عن رصيد الضمان'
        : 'Deliverable approved & escrow released';
    }
    if (eventKey === 'deliverable_submitted') {
      // The creator submits. For the creator that is "you", for the brand it is the other side.
      if (role === 'creator')
        return locale === 'ar' ? 'أرسلت فيديو جديداً' : 'You submitted a video';
      if (other) return locale === 'ar' ? `فيديو جديد من ${other}` : `${other} submitted a video`;
      return locale === 'ar'
        ? 'قام صانع المحتوى برفع نسخة مخرج جديدة'
        : 'Creator submitted deliverable';
    }
    if (eventKey === 'revision_requested') {
      // The brand asks. For the brand that is "you", for the creator it is the other side.
      if (role === 'brand') return locale === 'ar' ? 'طلبت تعديلاً' : 'You requested a revision';
      if (other) return locale === 'ar' ? `طلب تعديل من ${other}` : `${other} requested a revision`;
      return locale === 'ar' ? 'تم طلب تعديل على المخرج' : 'Revision requested by brand';
    }
    return null;
  };

  const renderSystemLabel = (msg: Message) => {
    const label = systemEventLabel(msg.event || '', activeThread?.counterpartName);
    if (label) return label;
    return msg.body || (msg.event || '').replace(/_/g, ' ');
  };

  /**
   * The API returns a system preview as a raw key in brackets, such as
   * "[escrow_funded]". Translate it, so no key reaches the screen.
   */
  const previewText = (raw: string | null | undefined, counterpart?: string | null): string => {
    const fallback = locale === 'ar' ? 'بدء المحادثة' : 'Conversation started';
    if (!raw) return fallback;
    const bracketed = raw.match(/^\[(\w+)\]$/);
    if (bracketed) {
      return systemEventLabel(bracketed[1], counterpart) ?? bracketed[1].replace(/_/g, ' ');
    }
    return raw;
  };

  const selectedCollab = collabQuery.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <AppText variant="caption" color={colors.textSecondary}>
            {role === 'brand'
              ? brandName
                ? locale === 'ar'
                  ? `محادثات ${brandName}`
                  : `${brandName} messages`
                : locale === 'ar'
                  ? 'محادثات العلامة التجارية'
                  : 'Brand messages'
              : firstName
                ? locale === 'ar'
                  ? `محادثات ${firstName}`
                  : `${firstName}'s messages`
                : locale === 'ar'
                  ? 'محادثات صانع المحتوى'
                  : 'Creator messages'}
          </AppText>
          <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
            {locale === 'ar' ? 'المحادثات والرسائل' : 'Chats'}
          </AppText>
        </div>

        <div style={{ display: 'flex', gap: spacing.xs }}>
          <FilterChip
            label={locale === 'ar' ? 'نشطة' : 'Active'}
            selected={filterState === 'active'}
            onClick={() => setFilterState('active')}
          />
          <FilterChip
            label={locale === 'ar' ? 'مكتملة' : 'Closed'}
            selected={filterState === 'closed'}
            onClick={() => setFilterState('closed')}
          />
        </div>
      </div>

      {/* Main 2-Pane Split Workspace */}
      <SplitPane
        minLeftWidth={300}
        selectedId={isThreadOpen ? selectedCollabId : null}
        onClearSelection={() => setIsThreadOpen(false)}
        backLabel={locale === 'ar' ? 'كل المحادثات' : 'All chats'}
        left={
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {/* Search Box */}
            <TextInput
              placeholder={locale === 'ar' ? 'بحث في المحادثات...' : 'Search chats...'}
              ariaLabel={locale === 'ar' ? 'ابحث في المحادثات' : 'Search chats'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Conversation List */}
            {filteredThreads.length === 0 ? (
              <Card
                elevation="card"
                style={{ padding: spacing.xl, textAlign: 'center', borderRadius: radius.card }}
              >
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  {locale === 'ar' ? 'لا توجد محادثات في هذا القسم' : 'No chats found.'}
                </AppText>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                {filteredThreads.map((t) => {
                  const isSelected = t.collaborationId === selectedCollabId;
                  const name = t.counterpartName || (locale === 'ar' ? 'مستخدم' : 'User');
                  const initials = t.counterpartInitials || getInitials(name);
                  const isUnread = (t.unreadCount ?? 0) > 0;

                  return (
                    <div
                      key={t.collaborationId}
                      role="button"
                      tabIndex={0}
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => openThread(t.collaborationId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openThread(t.collaborationId);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing.md,
                        borderRadius: radius.card,
                        backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                        border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: radius.card,
                            backgroundColor: colors.surface,
                            color: colors.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 500,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: isUnread ? 600 : 500,
                              fontSize: 14,
                              color: colors.textPrimary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: colors.textSecondary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {t.campaignTitle || 'Brief'}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: colors.textSecondary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: 2,
                            }}
                          >
                            {previewText(t.lastMessagePreview, t.counterpartName)}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{ textAlign: 'end', flexShrink: 0, marginInlineStart: spacing.sm }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: colors.textSecondary,
                            fontFamily: 'var(--font-mono, monospace)',
                          }}
                        >
                          {t.lastMessageAt ? formatDateShort(t.lastMessageAt, locale) : ''}
                        </div>
                        {isUnread && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.danger,
                              marginTop: 4,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        }
        right={
          selectedCollabId ? (
            <Card
              elevation="card"
              style={{
                borderRadius: radius.card,
                display: 'flex',
                flexDirection: 'column',
                height: 'min(650px, calc(100vh - 220px))',
                minHeight: 420,
                overflow: 'hidden',
                padding: 0,
              }}
            >
              {/* Thread Top Bar */}
              <div
                style={{
                  padding: spacing.md,
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.surface,
                  flexWrap: 'wrap',
                  gap: spacing.sm,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radius.card,
                      backgroundColor: colors.accentSoft,
                      color: colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 500,
                      fontSize: 15,
                    }}
                  >
                    {activeThread?.counterpartInitials ||
                      getInitials(activeThread?.counterpartName)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <AppText
                        variant="subtitle"
                        style={{ fontWeight: 500, color: colors.textPrimary }}
                      >
                        {activeThread?.counterpartName || 'Counterparty'}
                      </AppText>
                      {activeThread?.collaborationStatus && (
                        <StatusBadge
                          status={activeThread.collaborationStatus}
                          domain="collaboration"
                        />
                      )}
                    </div>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {activeThread?.campaignTitle || 'Brief'}
                    </AppText>
                  </div>
                </div>

                {selectedCollab && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                    <div style={{ textAlign: 'end' }}>
                      <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                        {locale === 'ar' ? 'الضمان' : 'Escrow'}
                      </AppText>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 500,
                          fontSize: 13,
                          direction: 'ltr',
                        }}
                      >
                        {formatMoney(selectedCollab.creatorPrice)}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (role === 'brand') {
                          router.push(`/brand/collaborations/${selectedCollabId}`);
                        } else {
                          router.push(`/creator/work/${selectedCollabId}`);
                        }
                      }}
                    >
                      {locale === 'ar' ? 'تفاصيل العمل' : 'Job details'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div
                style={{
                  flex: 1,
                  padding: spacing.lg,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  gap: spacing.md,
                  backgroundColor: colors.canvas,
                }}
              >
                {messages.map((msg) => {
                  const isSystem = msg.kind === 'system' || !!msg.event;
                  const isOwn = msg.senderUserId === user?.id;

                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBlock: spacing.xs,
                        }}
                      >
                        <div
                          style={{
                            padding: '4px 12px',
                            borderRadius: radius.chip,
                            border: `1px dashed ${colors.border}`,
                            backgroundColor: colors.surface,
                            fontSize: 12,
                            color: colors.textSecondary,
                            textAlign: 'center',
                          }}
                        >
                          {renderSystemLabel(msg)}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                        gap: 2,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: `${spacing.sm}px ${spacing.md}px`,
                          borderRadius: radius.card,
                          backgroundColor: isOwn ? colors.primary : colors.surface,
                          color: isOwn ? '#ffffff' : colors.textPrimary,
                          border: isOwn ? 'none' : `1px solid ${colors.border}`,
                          fontSize: 14,
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.body}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: colors.textTertiary,
                          fontFamily: 'var(--font-mono, monospace)',
                          direction: 'ltr',
                        }}
                      >
                        {formatDateShort(msg.sentAt || (msg as any).createdAt, locale)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {sendError ? (
                <div
                  role="alert"
                  style={{
                    padding: `${spacing.xs}px ${spacing.md}px`,
                    borderTop: `1px solid ${colors.border}`,
                    color: colors.danger,
                    fontSize: 13,
                  }}
                >
                  {sendError}
                </div>
              ) : null}

              {/* Message Composer */}
              <form
                onSubmit={handleSend}
                style={{
                  padding: spacing.md,
                  borderTop: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <div style={{ flex: 1 }}>
                  <TextInput
                    placeholder={locale === 'ar' ? 'اكتب رسالتك هنا...' : 'Type a message...'}
                    value={messageText}
                    onChangeText={setMessageText}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  loading={sendMessage.isPending}
                  disabled={!messageText.trim()}
                >
                  <Icon name="send" size={16} />
                  <span>{locale === 'ar' ? 'إرسال' : 'Send'}</span>
                </Button>
              </form>
            </Card>
          ) : (
            <Card
              elevation="card"
              style={{ padding: spacing.xl, textAlign: 'center', borderRadius: radius.card }}
            >
              <AppText variant="bodySmall" color={colors.textSecondary}>
                {locale === 'ar'
                  ? 'اختر محادثة لعرض الرسائل'
                  : 'Select a conversation to start chatting.'}
              </AppText>
            </Card>
          )
        }
      />
    </div>
  );
}
