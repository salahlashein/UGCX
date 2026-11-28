'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { colors, radius, sizes, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import { AppText } from '../ui/AppText';
import { Icon, type IconName } from '../ui/Icon';
import { LoadingState } from '../ui/AsyncStates';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStatus } from '../../hooks/api/useOnboarding';
import { useMe } from '../../hooks/api/useMe';
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
  const [moreOpen, setMoreOpen] = useState(false);
  const meQuery = useMe();
  // A new brand or creator finishes onboarding before using the app. If the
  // status cannot load, the user is let through rather than locked out.
  const needsOnboardingCheck = Boolean(isAuthenticated && user && user.role !== 'admin');
  const onboardingQuery = useOnboardingStatus(needsOnboardingCheck);
  const mustOnboard = needsOnboardingCheck && onboardingQuery.data?.completed === false;
  const checkingOnboarding = needsOnboardingCheck && onboardingQuery.isLoading;

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (mustOnboard) {
      router.replace('/onboarding');
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      router.replace(user.role === 'brand' ? '/brand/dashboard' : '/creator/home');
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router, mustOnboard]);

  if (isLoading || !isAuthenticated || !user || checkingOnboarding || mustOnboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  const navItems = user.role === 'brand' ? BRAND_NAV : CREATOR_NAV;
  // Phones show the first four sections as tabs; everything else lives in
  // the "More" sheet so no destination is unreachable (UI audit G3).
  const primaryTabs = navItems.slice(0, 4);
  const moreLinks: { href: string; label: string; icon: IconName; badge?: number }[] = [
    ...navItems.slice(4).map((item) => ({
      href: item.href,
      label: t(item.labelKey, item.defaultLabel),
      icon: item.icon,
    })),
    ...(user.role === 'brand' && canBrand('viewBilling')
      ? [
          {
            href: '/brand/billing',
            label: t('nav.billing', 'Billing'),
            icon: 'credit-card' as IconName,
          },
        ]
      : []),
    ...(user.role === 'creator'
      ? [
          {
            href: '/creator/proposals',
            label: t('nav.myApplications', 'My Proposals'),
            icon: 'inbox' as IconName,
          },
        ]
      : []),
    {
      href: '/notifications',
      label: t('nav.notifications', 'Notifications'),
      icon: 'bell',
      badge: unreadCount,
    },
    { href: '/settings', label: t('nav.settings', 'Settings'), icon: 'settings' },
  ];
  const moreActive = moreLinks.some((l) => pathname.startsWith(l.href));

  // Readable role under the logo instead of the raw "brand · owner" (G9).
  const brandRoleLabels: Record<string, [string, string]> = {
    owner: ['Owner', 'مالك'],
    approver: ['Approver', 'معتمد'],
    viewer: ['Viewer', 'مشاهد'],
  };
  // The person's own name when it is saved. The role word is only a fallback.
  const personName = meQuery.data?.displayName?.trim() || null;
  const roleLabel =
    user.role === 'brand'
      ? [
          personName ?? (locale === 'ar' ? 'براند' : 'Brand'),
          brandRole ? (brandRoleLabels[brandRole]?.[locale === 'ar' ? 1 : 0] ?? brandRole) : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : (personName ?? (locale === 'ar' ? 'كريتور' : 'Creator'));

  const isActive = (item: NavItem) => {
    return pathname === item.href || pathname.startsWith(item.matchPrefix);
  };

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ backgroundColor: colors.canvas }}
    >
      {/* Desktop Left Sidebar */}
      <aside
        className="ugcx-desktop-sidebar shrink-0 self-stretch"
        style={{
          width: `${sizes.sidebarWidth}px`,
          backgroundColor: colors.surface,
          borderInlineEnd: `1px solid ${colors.hairline}`,
        }}
      >
        {/* The column stretches with the page (G13); the nav stays in view. */}
        <div
          className="sticky top-0 h-screen flex flex-col justify-between"
          style={{ padding: `${spacing.lg}px` }}
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
                    {roleLabel}
                  </span>
                </div>
              </Link>
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
                <AppText
                  variant="bodySm"
                  color={pathname === '/notifications' ? 'primary' : 'body'}
                >
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
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className="ugcx-main flex-1 w-full max-w-5xl mx-auto min-w-0"
        style={{
          paddingInline: `${spacing.lg}px`,
          paddingTop: `${spacing.lg}px`,
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
        {primaryTabs.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-0.5 no-underline"
              style={{
                minWidth: 56,
                minHeight: 44,
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
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-controls="ugcx-more-sheet"
          className="relative flex flex-col items-center justify-center gap-0.5 cursor-pointer"
          style={{
            minWidth: 56,
            minHeight: 44,
            paddingBlock: `${spacing.xxs}px`,
            background: 'none',
            border: 'none',
          }}
        >
          <Icon
            name="more-horizontal"
            size={18}
            color={moreOpen || moreActive ? 'signatureMint' : 'onDark'}
          />
          <AppText variant="overline" color={moreOpen || moreActive ? 'signatureMint' : 'onDark'}>
            {locale === 'ar' ? 'المزيد' : 'More'}
          </AppText>
          {unreadCount > 0 ? (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 2,
                insetInlineEnd: 12,
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: colors.danger,
              }}
            />
          ) : null}
        </button>
      </nav>

      {moreOpen ? (
        <>
          <div
            className="ugcx-mobile-only fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(23, 36, 28, 0.25)' }}
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div
            id="ugcx-more-sheet"
            role="dialog"
            aria-label={locale === 'ar' ? 'المزيد' : 'More'}
            className="ugcx-mobile-only fixed inset-x-4 z-50 flex flex-col"
            style={{
              bottom: `${sizes.tabBarHeight + 24}px`,
              backgroundColor: colors.surface,
              borderRadius: `${radius.card}px`,
              boxShadow: elevation.soft,
              padding: `${spacing.sm}px`,
            }}
          >
            {moreLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-center justify-between gap-3 no-underline"
                  style={{
                    minHeight: 48,
                    paddingInline: `${spacing.md}px`,
                    borderRadius: `${radius.button}px`,
                    backgroundColor: active ? colors.accentSoft : 'transparent',
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Icon name={link.icon} size={19} color={active ? 'primary' : 'muted'} />
                    <AppText variant="label" color={active ? 'primary' : 'body'}>
                      {link.label}
                    </AppText>
                  </span>
                  {link.badge ? (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        paddingInline: '8px',
                        borderRadius: `${radius.pill}px`,
                        backgroundColor: colors.primary,
                        color: colors.onPrimary,
                      }}
                    >
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                toggleLocale();
                setMoreOpen(false);
              }}
              className="flex items-center gap-3 w-full text-start cursor-pointer"
              style={{
                minHeight: 48,
                paddingInline: `${spacing.md}px`,
                borderRadius: `${radius.button}px`,
                background: 'none',
                border: 'none',
              }}
            >
              <Icon name="globe" size={19} color="muted" />
              <AppText variant="label" color="body">
                {locale === 'en' ? 'العربية' : 'English'}
              </AppText>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-start cursor-pointer"
              style={{
                minHeight: 48,
                paddingInline: `${spacing.md}px`,
                borderRadius: `${radius.button}px`,
                background: 'none',
                border: 'none',
              }}
            >
              <Icon name="log-out" size={19} color="danger" />
              <AppText variant="label" color="danger">
                {t('common.logout', 'Log out')}
              </AppText>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
