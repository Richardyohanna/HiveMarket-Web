import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { forgotPassword, resetPassword } from '../api/authApi';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { ApiError } from '../lib/apiClient';
import { ErrorBanner, FieldLabel, PageShell, PrimaryButton, SuccessBanner, TextInput } from '../components/ui';

type RecoveryStage = 'closed' | 'request' | 'reset';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recoveryStage, setRecoveryStage] = useState<RecoveryStage>('closed');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const requestedRedirect = new URLSearchParams(window.location.search).get('redirect');
  const redirectTarget = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : '/shopping';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);
    try {
      await login(identifier.trim(), password.trim());
      navigate(redirectTarget, { replace: true });
    } catch (loginError: unknown) {
      setError(loginError instanceof ApiError && loginError.status === 401
        ? 'Incorrect email/phone or password.'
        : getErrorMessage(loginError, 'Unable to sign in. Check your connection and try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);
    try {
      const response = await forgotPassword(recoveryEmail.trim());
      setRecoveryStage('reset');
      setNotice(response.message || 'Check your email for a password reset code.');
    } catch (resetError: unknown) {
      setError(getErrorMessage(resetError, 'Unable to request a password reset.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function completeReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (newPassword.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await resetPassword(recoveryEmail.trim(), recoveryCode.trim(), newPassword);
      setRecoveryStage('closed');
      setIdentifier(recoveryEmail.trim());
      setPassword('');
      setRecoveryCode('');
      setNewPassword('');
      setNotice(response.message || 'Password updated. Sign in with your new password.');
    } catch (resetError: unknown) {
      setError(getErrorMessage(resetError, 'Unable to reset your password.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell title="Sign in to HiveMarket" subtitle="Use your account email or phone number and password.">
      <ErrorBanner message={error} />
      <SuccessBanner message={notice} />

      {recoveryStage === 'closed' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel htmlFor="login-identifier">Email or phone number</FieldLabel>
            <TextInput
              id="login-identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="you@example.com or 08012345678"
            />
          </div>
          <div>
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <div className="relative">
              <TextInput
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-controls="login-password"
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 hover:text-[#008100] focus-visible:outline-2 focus-visible:outline-[#008100]"
              >
                {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setRecoveryEmail(identifier.includes('@') ? identifier.trim() : '');
                setRecoveryStage('request');
                setError(null);
                setNotice(null);
              }}
              className="mt-2 text-sm font-medium text-[#008100] hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <PrimaryButton type="submit" isLoading={isLoading}>Sign in</PrimaryButton>
          <p className="text-center text-sm text-[#4b5158]">
            Don&apos;t have an account?{' '}
            <a href="/register" onClick={(event) => { event.preventDefault(); navigate('/register'); }} className="font-semibold text-[#008100] hover:underline">
              Create one
            </a>
          </p>
        </form>
      ) : recoveryStage === 'request' ? (
        <form onSubmit={requestReset} className="space-y-4">
          <p className="text-sm text-[#4b5158]">We&apos;ll email you a reset code.</p>
          <div>
            <FieldLabel htmlFor="recovery-email">Email address</FieldLabel>
            <TextInput
              id="recovery-email"
              type="email"
              autoComplete="email"
              required
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
            />
          </div>
          <PrimaryButton type="submit" isLoading={isLoading}>Send reset code</PrimaryButton>
          <button type="button" onClick={() => setRecoveryStage('closed')} className="w-full text-sm font-medium text-[#008100] hover:underline">
            Back to sign in
          </button>
        </form>
      ) : (
        <form onSubmit={completeReset} className="space-y-4">
          <p className="text-sm text-[#4b5158]">Enter the code sent to {recoveryEmail} and choose a new password.</p>
          <div>
            <FieldLabel htmlFor="recovery-code">Reset code</FieldLabel>
            <TextInput
              id="recovery-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <div className="relative">
              <TextInput
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((visible) => !visible)}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                aria-controls="new-password"
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 hover:text-[#008100] focus-visible:outline-2 focus-visible:outline-[#008100]"
              >
                {showNewPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <PrimaryButton type="submit" isLoading={isLoading}>Reset password</PrimaryButton>
          <button type="button" onClick={() => setRecoveryStage('closed')} className="w-full text-sm font-medium text-[#008100] hover:underline">
            Back to sign in
          </button>
        </form>
      )}
    </PageShell>
  );
}
