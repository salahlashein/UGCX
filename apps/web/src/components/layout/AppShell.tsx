'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { colors, radius, sizes, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import { AppText } from '../ui/AppText';
import { Icon, type IconName } from '../ui/Icon';
import { LoadingState } from '../ui/AsyncStates';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n';
import { useBrandRole } from '../../hooks/useBrandRole';
import { useUnreadCount } from '../../hooks/api/useNotifications';

interface NavItem {
  href: string;
  labelKey: string;
  defaultLabel: string;
  icon: IconName;
  matchPrefix: string;
}

const BRAND_NAV: NavItem[] = [
  {
    href: '/brand/dashboard',
    labelKey: 'nav.dashboard',
    defaultLabel: 'Dashboard',
    icon: 'home',
    matchPrefix: '/brand/dashboard',
  },
  {
    href: '/brand/briefs',
    labelKey: 'nav.briefs',
    defaultLabel: 'Briefs',
    icon: 'file-text',
    matchPrefix: '/brand/briefs',
  },
  {
    href: '/brand/proposals',
    labelKey: 'nav.proposals',
    defaultLabel: 'Proposals',
    icon: 'inbox',
    matchPrefix: '/brand/proposals',
  },
  {
    href: '/brand/chats',
    labelKey: 'nav.chats',
    defaultLabel: 'Chats',
    icon: 'message-circle',
    matchPrefix: '/brand/chats',
  },
  {
    href: '/brand/profile',
    labelKey: 'nav.profile',
    defaultLabel: 'Profile',
    icon: 'user',
    matchPrefix: '/brand/profile',
  },
];

const CREATOR_NAV: NavItem[] = [
  {
    href: '/creator/home',
    labelKey: 'nav.home',
    defaultLabel: 'Home',
    icon: 'home',
    matchPrefix: '/creator/home',
  },
  {
    href: '/creator/discover',
    labelKey: 'nav.discover',
    defaultLabel: 'Discover',
    icon: 'compass',
    matchPrefix: '/creator/discover',
  },
  {
    href: '/creator/work',
    labelKey: 'nav.work',
    defaultLabel: 'Work',
    icon: 'briefcase',
    matchPrefix: '/creator/work',
  },
  {
    href: '/creator/chats',
    labelKey: 'nav.chats',
    defaultLabel: 'Chats',
    icon: 'message-circle',
    matchPrefix: '/creator/chats',
  },
  {
    href: '/creator/earnings',
    labelKey: 'nav.earnings',
    defaultLabel: 'Earnings',
    icon: 'wallet',
    matchPrefix: '/creator/earnings',
  },
  {
    href: '/creator/profile',
    labelKey: 'nav.profile',
    defaultLabel: 'Profile',
    icon: 'user',
    matchPrefix: '/creator/profile',
  },
];

export interface AppShellProps {
  children: React.ReactNode;
  requiredRole?: 'brand' | 'creator';
  activeNav?: string;
}

export function AppShell({ children, requiredRole, activeNav }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, clearAuth } = useAuthStore();
  const { t, locale, toggleLocale } = useTranslation();
  const { role: brandRole, can: canBrand } = useBrandRole();
  const unreadCountQuery = useUnreadCount();
  const unreadCount = unreadCountQuery.data?.unread ?? 0;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      router.replace(user.role === 'brand' ? '/brand/dashboard' : '/creator/home');
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  const navItems = user.role === 'brand' ? BRAND_NAV : CREATOR_NAV;

  const isActive = (item: NavItem) => {
    return pathname === item.href || pathname.startsWith(item.matchPrefix);
  };

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: colors.canvas }}
    >
      {/* Desktop Left Sidebar */}
      <aside
        className="ugcx-desktop-sidebar flex-col justify-between shrink-0 sticky top-0 h-screen"
        style={{
          width: `${sizes.sidebarWidth}px`,
          backgroundColor: colors.surface,
          borderInlineEnd: `1px solid ${colors.hairline}`,
          padding: `${spacing.lg}px`,
        }}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link
              href={user.role === 'brand' ? '/brand/dashboard' : '/creator/home'}
              className="flex items-center gap-2.5 no-underline"
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: `${radius.button}px`,
                  backgroundColor: colors.primary,
                }}
              >
                <AppText variant="label" color="onPrimary">
                  U
                </AppText>
              </div>
              <div className="flex flex-col min-w-0">
                <AppText variant="titleSm" color="ink">
                  {t('common.appName', 'ReelPal')}
                </AppText>
                <span
                  className="mono-caps truncate"
                  data-mono-caps="true"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    lineHeight: '13px',
                    letterSpacing: '0.6px',
                    fontWeight: 500,
                    color: colors.muted,
                    textTransform: 'uppercase',
                  }}
                >
                  {user.role}
                  {user.role === 'brand' && brandRole ? ` · ${brandRole}` : ''}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={toggleLocale}
              className="cursor-pointer"
              style={{
                paddingInline: `${spacing.sm}px`,
                paddingBlock: `${spacing.xxs}px`,
                borderRadius: `${radius.chip}px`,
                backgroundColor: colors.accentSoft,
                border: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: colors.primary,
                }}
              >
                {locale === 'en' ? 'العربية' : 'EN'}
              </span>
            </button>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-3 no-underline transition-colors duration-150"
                  style={{
                    paddingInline: `${spacing.md}px`,
                    paddingBlock: `${spacing.sm}px`,
                    borderRadius: `${radius.button}px`,
                    backgroundColor: active ? colors.accentSoft : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon name={item.icon} size={19} color={active ? 'primary' : 'muted'} />
                    <AppText variant="label" color={active ? 'primary' : 'body'}>
                      {t(item.labelKey, item.defaultLabel)}
                    </AppText>
                  </div>
                </Link>
              );
            })}

            {user.role === 'brand' && canBrand('viewBilling') ? (
              <Link
                href="/brand/billing"
                className="flex items-center gap-3 no-underline transition-colors duration-150"
                style={{
                  paddingInline: `${spacing.md}px`,
                  paddingBlock: `${spacing.sm}px`,
                  borderRadius: `${radius.button}px`,
                  backgroundColor: pathname.startsWith('/brand/billing')
                    ? colors.accentSoft
                    : 'transparent',
                }}
              >
                <Icon
                  name="credit-card"
                  size={19}
                  color={pathname.startsWith('/brand/billing') ? 'primary' : 'muted'}
                />
                <AppText
                  variant="label"
                  color={pathname.startsWith('/brand/billing') ? 'primary' : 'body'}
                >
                  {t('nav.billing', 'Billing')}
                </AppText>
              </Link>
            ) : null}

            {user.role === 'creator' ? (
              <Link
                href="/creator/proposals"
                className="flex items-center gap-3 no-underline transition-colors duration-150"
                style={{
                  paddingInline: `${spacing.md}px`,
                  paddingBlock: `${spacing.sm}px`,
                  borderRadius: `${radius.button}px`,
                  backgroundColor: pathname.startsWith('/creator/proposals')
                    ? colors.accentSoft
                    : 'transparent',
                }}
              >
                <Icon
                  name="inbox"
                  size={19}
                  color={pathname.startsWith('/creator/proposals') ? 'primary' : 'muted'}
                />
                <AppText
                  variant="label"
                  color={pathname.startsWith('/creator/proposals') ? 'primary' : 'body'}
                >
                  {t('nav.myApplications', 'My Proposals')}
                </AppText>
              </Link>
            ) : null}
          </nav>
        </div>

        <div
          className="flex flex-col gap-1.5 pt-4"
          style={{ borderTop: `1px dashed ${colors.dashLine}` }}
        >
          <Link
            href="/notifications"
            className="flex items-center justify-between gap-3 no-underline"
            style={{
              paddingInline: `${spacing.md}px`,
              paddingBlock: `${spacing.xs}px`,
              borderRadius: `${radius.button}px`,
              backgroundColor: pathname === '/notifications' ? colors.accentSoft : 'transparent',
            }}
          >
            <div className="flex items-center gap-3">
              <Icon
                name="bell"
                size={18}
                color={pathname === '/notifications' ? 'primary' : 'muted'}
              />
              <AppText variant="bodySm" color={pathname === '/notifications' ? 'primary' : 'body'}>
                {t('nav.notifications', 'Notifications')}
              </AppText>
            </div>
            {unreadCount > 0 ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: '14px',
                  fontWeight: 500,
                  paddingInline: '6px',
                  paddingBlock: '1px',
                  borderRadius: `${radius.pill}px`,
                  backgroundColor: colors.primary,
                  color: colors.onPrimary,
                }}
              >
                {unreadCount}
              </span>
            ) : null}
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 no-underline"
            style={{
              paddingInline: `${spacing.md}px`,
              paddingBlock: `${spacing.xs}px`,
              borderRadius: `${radius.button}px`,
              backgroundColor: pathname === '/settings' ? colors.accentSoft : 'transparent',
            }}
          >
            <Icon
              name="settings"
              size={18}
              color={pathname === '/settings' ? 'primary' : 'muted'}
            />
            <AppText variant="bodySm" color={pathname === '/settings' ? 'primary' : 'body'}>
              {t('nav.settings', 'Settings')}
            </AppText>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-start cursor-pointer"
            style={{
              paddingInline: `${spacing.md}px`,
              paddingBlock: `${spacing.xs}px`,
              borderRadius: `${radius.button}px`,
              backgroundColor: 'transparent',
              border: 'none',
            }}
          >
            <Icon name="log-out" size={18} color="danger" />
            <AppText variant="bodySm" color="danger">
              {t('common.logout', 'Log out')}
            </AppText>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className="flex-1 w-full max-w-5xl mx-auto"
        style={{
          paddingInline: `${spacing.lg}px`,
          paddingTop: `${spacing.lg}px`,
          paddingBottom: `${spacing.section}px`,
        }}
      >
        {children}
      </main>

      {/* Mobile Floating Dark Tab Bar */}
      <nav
        className="ugcx-mobile-tabbar fixed bottom-4 inset-x-4 z-40 items-center justify-around"
        aria-label="Mobile navigation"
        style={{
          height: `${sizes.tabBarHeight}px`,
          backgroundColor: colors.surfaceDark,
          borderRadius: `${radius.pill}px`,
          boxShadow: elevation.soft,
          paddingInline: `${spacing.sm}px`,
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 no-underline"
              style={{
                minWidth: 52,
                paddingBlock: `${spacing.xxs}px`,
              }}
            >
              <Icon name={item.icon} size={18} color={active ? 'signatureMint' : 'onDark'} />
              <AppText variant="overline" color={active ? 'signatureMint' : 'onDark'}>
                {t(item.labelKey, item.defaultLabel)}
              </AppText>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
