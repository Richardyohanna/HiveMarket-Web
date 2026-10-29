import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { ApiError } from '../lib/apiClient';
import { ErrorBanner, FieldLabel, PageShell, PrimaryButton, TextInput } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTarget = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || '/shopping';
  })();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Incorrect email/phone or password.' : err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell title="Sign in to HiveMarket" subtitle="Use your account email or phone number and password.">
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FieldLabel>Email or phone number</FieldLabel>
          <TextInput
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or 08012345678"
          />
        </div>
        <div>
          <FieldLabel>Password</FieldLabel>
          <TextInput
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <PrimaryButton type="submit" isLoading={isLoading}>
          Sign in
        </PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm text-[#4b5158]">
        Don't have an account? Sign up from the HiveMarket mobile app.
      </p>
    </PageShell>
  );
}
