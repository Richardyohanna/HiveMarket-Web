import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { register, resendVerificationCode, verifyEmail } from '../api/authApi';
import { ErrorBanner, FieldLabel, PageShell, PrimaryButton, SuccessBanner, TextInput } from '../components/ui';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';

type RegistrationStage = 'form' | 'verification';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function RegisterPage() {
  const { completeRegistration } = useAuth();
  const { navigate } = useRouter();
  const [stage, setStage] = useState<RegistrationStage>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (fullName.trim().length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await register({ fullName: fullName.trim(), email: email.trim(), password: password.trim() });
      setStage('verification');
      setVerificationCode('');
      setResendSeconds(60);
      setNotice(response.message || 'A verification code has been sent to your email.');
    } catch (registrationError: unknown) {
      setError(getErrorMessage(registrationError, 'Unable to create your account.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (verificationCode.trim().length !== 8) {
      setError('Enter the 8-character verification code from your email.');
      return;
    }
    setIsLoading(true);
    try {
      const session = await verifyEmail(email.trim(), verificationCode.trim());
      await completeRegistration(session);
      navigate('/shopping', { replace: true });
    } catch (verificationError: unknown) {
      setError(getErrorMessage(verificationError, 'Email verification failed. Check the code and try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function resendCode() {
    if (resendSeconds > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);
    setNotice(null);
    try {
      const response = await resendVerificationCode(email.trim());
      setVerificationCode('');
      setResendSeconds(60);
      setNotice(response.message || 'A new verification code has been sent.');
    } catch (resendError: unknown) {
      setError(getErrorMessage(resendError, 'Unable to resend the verification code.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell
      title={stage === 'form' ? 'Create your HiveMarket account' : 'Verify your email'}
      subtitle={stage === 'form'
        ? 'Use the same account to sign in on the website and mobile app.'
        : `Enter the 8-character code sent to ${email}.`}
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={notice} />

      {stage === 'form' ? (
        <form onSubmit={submitRegistration} className="space-y-4">
          <div>
            <FieldLabel htmlFor="register-name">Full name</FieldLabel>
            <TextInput
              id="register-name"
              type="text"
              autoComplete="name"
              minLength={2}
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div>
            <FieldLabel htmlFor="register-email">Email</FieldLabel>
            <TextInput
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <FieldLabel htmlFor="register-password">Password</FieldLabel>
            <div className="relative">
              <TextInput
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-controls="register-password"
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 hover:text-[#008100] focus-visible:outline-2 focus-visible:outline-[#008100]"
              >
                {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="register-confirm-password">Confirm password</FieldLabel>
            <div className="relative">
              <TextInput
                id="register-confirm-password"
                type={showConfirmation ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Enter your password again"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((visible) => !visible)}
                aria-label={showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}
                aria-controls="register-confirm-password"
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 hover:text-[#008100] focus-visible:outline-2 focus-visible:outline-[#008100]"
              >
                {showConfirmation ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <p className="text-xs leading-5 text-gray-500">A valid email is required for verification. Phone-only registration is not supported by the current backend contract.</p>
          <PrimaryButton type="submit" isLoading={isLoading}>Create account</PrimaryButton>
          <p className="text-center text-sm text-[#4b5158]">
            Already have an account?{' '}
            <a href="/login" onClick={(event) => { event.preventDefault(); navigate('/login'); }} className="font-semibold text-[#008100] hover:underline">
              Sign in
            </a>
          </p>
        </form>
      ) : (
        <form onSubmit={verifyRegistration} className="space-y-4">
          <div>
            <FieldLabel htmlFor="verification-code">Verification code</FieldLabel>
            <TextInput
              id="verification-code"
              type="text"
              autoComplete="one-time-code"
              required
              maxLength={8}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="8-character code"
            />
          </div>
          <PrimaryButton type="submit" isLoading={isLoading}>Verify email</PrimaryButton>
          <button
            type="button"
            disabled={resendSeconds > 0 || isLoading}
            onClick={() => void resendCode()}
            className="w-full text-sm font-medium text-[#008100] hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend verification code'}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => { setStage('form'); setError(null); setNotice(null); }}
            className="w-full text-sm text-gray-600 hover:underline"
          >
            Back to registration details
          </button>
        </form>
      )}
    </PageShell>
  );
}
