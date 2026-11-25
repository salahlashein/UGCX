'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OTP_CODE_LENGTH, type UserRole, type RegisterResponse } from '@ugcx/shared-types';
import { colors, radius, spacing } from '../../../theme/tokens';
import {
  AppText,
  Button,
  Card,
  HStepper,
  Icon,
  OtpInput,
  SegmentedControl,
  Tag,
  TextInput,
} from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import { useAuthStore } from '../../../store/authStore';
import { apiPost, extractErrorMessage } from '../../../services/apiHelpers';
import { formatResend } from '../../../utils/format';

type AuthMode = 'otp' | 'password';
type AuthStep = 1 | 2;

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, toggleLocale } = useTranslation();
  const setTokensFromResponse = useAuthStore((s) => s.setTokensFromResponse);

  const [role, setRole] = useState<'brand' | 'creator'>('brand');
  const [mode, setMode] = useState<AuthMode>('otp');
  const [step, setStep] = useState<AuthStep>(1);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Resend timer
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, secondsLeft]);

  const navigateForRole = (resolvedRole: UserRole) => {
    if (resolvedRole === 'brand') {
      router.push('/brand/dashboard');
    } else if (resolvedRole === 'admin') {
      router.push('/admin');
    } else {
      router.push('/creator/home');
    }
  };

  const handleSendOtp = async (targetEmail = email) => {
    setError(null);
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await apiPost('/auth/otp/send', { email: cleanEmail, role });
      setStep(2);
      setSecondsLeft(60);
      setTimerActive(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify = otp) => {
    setError(null);
    if (codeToVerify.length !== OTP_CODE_LENGTH) {
      setError('Enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<RegisterResponse>('/auth/otp/verify', {
        email: email.trim().toLowerCase(),
        otp: codeToVerify,
        role,
      });

      const authUser = setTokensFromResponse({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        userId: res.userId,
        role: res.role,
        email: email.trim().toLowerCase(),
      });

      navigateForRole(authUser.role);
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          locale === 'ar'
            ? 'رمز التحقق غير صحيح أو منتهي الصلاحية. يرجى طلب رمز جديد.'
            : 'The code is wrong or expired. Request a new one.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<RegisterResponse>('/auth/login', {
        email: cleanEmail,
        password,
      });

      const authUser = setTokensFromResponse({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        userId: res.userId,
        role: res.role,
        email: cleanEmail,
      });

      navigateForRole(authUser.role);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'brand' | 'creator') => {
    setError(null);
    setLoading(true);
    const demoEmail = demoRole === 'brand' ? 'brand@example.com' : 'creator@example.com';
    setEmail(demoEmail);
    setRole(demoRole);

    try {
      await apiPost('/auth/otp/send', { email: demoEmail, role: demoRole });
      const res = await apiPost<RegisterResponse>('/auth/otp/verify', {
        email: demoEmail,
        otp: '000000',
        role: demoRole,
      });

      const authUser = setTokensFromResponse({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        userId: res.userId,
        role: res.role,
        email: demoEmail,
      });

      navigateForRole(authUser.role);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isDevOrTest = process.env.NODE_ENV !== 'production';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.canvas,
        padding: spacing.xl,
      }}
    >
      {/* Top Bar Language Switch */}
      <header
        style={{
          position: 'absolute',
          top: spacing.lg,
          insetInlineEnd: spacing.xl,
        }}
      >
        <Button variant="secondary" size="sm" onClick={toggleLocale}>
          {locale === 'en' ? 'العربية' : 'English'}
        </Button>
      </header>

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.xl,
        }}
      >
        {/* Logo and Brand Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colors.primary,
              color: colors.surface,
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: -0.5,
            }}
          >
            U
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
              ReelPal
            </AppText>
            <AppText variant="overlineMono" color={colors.textSecondary}>
              {locale === 'ar' ? 'فيديوهات صناع المحتوى · ضمان' : 'Creator videos · Escrow'}
            </AppText>
          </div>
        </div>

        {/* Main Auth Card */}
        <Card
          elevation="card"
          style={{
            width: '100%',
            padding: spacing.xl,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.lg,
            borderRadius: radius.card,
          }}
        >
          {/* Stepper when in OTP mode */}
          {mode === 'otp' && (
            <HStepper
              steps={[
                {
                  label: locale === 'ar' ? 'البريد الإلكتروني' : 'Email',
                  state: step === 1 ? 'current' : 'done',
                },
                {
                  label: locale === 'ar' ? 'رمز التحقق' : 'Code',
                  state: step === 2 ? 'current' : 'todo',
                },
              ]}
            />
          )}

          {/* Role Segment */}
          <div>
            <SegmentedControl
              fullWidth
              options={[
                { label: locale === 'ar' ? 'علامة تجارية' : 'Brand', value: 'brand' },
                { label: locale === 'ar' ? 'صانع محتوى' : 'Creator', value: 'creator' },
              ]}
              value={role}
              onChange={(val) => {
                setRole(val as 'brand' | 'creator');
                setError(null);
              }}
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radius.chip,
                backgroundColor: '#fef2f2',
                border: `1px solid ${colors.danger}`,
                color: colors.danger,
                fontSize: 13,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {error}
            </div>
          )}

          {/* OTP Mode - Step 1: Email */}
          {mode === 'otp' && step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
            >
              <TextInput
                label={
                  role === 'brand'
                    ? locale === 'ar'
                      ? 'إيميل الشغل'
                      : 'Work email address'
                    : locale === 'ar'
                      ? 'الإيميل'
                      : 'Email address'
                }
                type="email"
                placeholder={role === 'brand' ? 'name@company.com' : 'name@gmail.com'}
                value={email}
                onChangeText={setEmail}
                mono
                dir="ltr"
              />

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                {locale === 'ar' ? 'إرسال الرمز' : 'Send verification code'}
              </Button>
            </form>
          )}

          {/* OTP Mode - Step 2: Verification Code */}
          {mode === 'otp' && step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              <div style={{ textAlign: 'center' }}>
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  {locale === 'ar'
                    ? `أدخل رمز التحقق المكون من 6 أرقام المرسل إلى`
                    : `Enter the 6-digit code sent to`}
                </AppText>
                <div style={{ direction: 'ltr', marginTop: 2 }}>
                  <AppText variant="mono" style={{ fontWeight: 500, color: colors.textPrimary }}>
                    {email}
                  </AppText>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <OtpInput
                  length={OTP_CODE_LENGTH}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    setError(null);
                    if (val.length === OTP_CODE_LENGTH) {
                      handleVerifyOtp(val);
                    }
                  }}
                  autoFocus
                />
              </div>

              <Button
                variant="primary"
                fullWidth
                loading={loading}
                disabled={otp.length !== OTP_CODE_LENGTH}
                onClick={() => handleVerifyOtp()}
              >
                {locale === 'ar' ? 'تحقق والمتابعة' : 'Verify & continue'}
              </Button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  marginTop: spacing.xs,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.primary,
                    cursor: 'pointer',
                    fontSize: 13,
                    padding: 0,
                  }}
                >
                  {locale === 'ar' ? 'تغيير البريد' : 'Change email'}
                </button>

                {timerActive ? (
                  <span
                    style={{
                      color: colors.textTertiary,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {locale === 'ar' ? 'إعادة الإرسال بعد' : 'Resend in'}{' '}
                    {formatResend(secondsLeft)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.primary,
                      cursor: 'pointer',
                      fontSize: 13,
                      padding: 0,
                    }}
                  >
                    {locale === 'ar' ? 'إعادة إرسال الرمز' : 'Resend code'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Password Mode */}
          {mode === 'password' && (
            <form
              onSubmit={handlePasswordLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
            >
              <TextInput
                label={locale === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                type="email"
                placeholder="name@company.com"
                value={email}
                onChangeText={setEmail}
                mono
                dir="ltr"
              />

              <TextInput
                label={locale === 'ar' ? 'كلمة المرور' : 'Password'}
                type="password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
              />

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                {locale === 'ar' ? 'تسجيل الدخول' : 'Sign in with password'}
              </Button>
            </form>
          )}

          {/* Method Toggle Link. Accounts are made by email code and have no
              password, so the password form exists only for the seeded demo
              accounts in development (UI audit login/C1). */}
          {isDevOrTest && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                borderTop: `1px dashed ${colors.border}`,
                paddingTop: spacing.md,
              }}
            >
              {mode === 'otp' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('password');
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.primary,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {locale === 'ar' ? 'تسجيل الدخول بكلمة المرور' : 'Use password instead'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode('otp');
                    setStep(1);
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.primary,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {locale === 'ar' ? 'تسجيل الدخول برمز البريد (OTP)' : 'Use email code instead'}
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Development Demo Logins Box */}
        {isDevOrTest && (
          <div
            style={{
              width: '100%',
              padding: spacing.md,
              borderRadius: radius.card,
              border: `1px dashed ${colors.border}`,
              backgroundColor: colors.surface,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="caption" style={{ fontWeight: 500, color: colors.textSecondary }}>
                DEV &amp; TEST SHORTCUTS
              </AppText>
              <Tag tone="muted">DEV ONLY</Tag>
            </div>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => handleDemoLogin('brand')}
                disabled={loading}
              >
                Demo Brand
              </Button>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => handleDemoLogin('creator')}
                disabled={loading}
              >
                Demo Creator
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
