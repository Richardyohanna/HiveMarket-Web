import { useState, type FormEvent } from 'react';
import { ApiError } from '../lib/apiClient';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { ErrorBanner, FieldLabel, PageShell, PrimaryButton, TextInput } from '../components/ui';

export default function PasswordChangePage() {
  const { changePassword, user } = useAuth();
  const { navigate } = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('The new passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change your password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      title={user?.mustChangePassword ? 'Set a new password' : 'Change your password'}
      subtitle={user?.mustChangePassword
        ? 'For your security, replace the temporary password before continuing.'
        : 'Confirm your current password and choose a new one.'}
    >
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FieldLabel>Current password</FieldLabel>
          <TextInput
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>
        <div>
          <FieldLabel>New password (minimum 8 characters)</FieldLabel>
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Confirm new password</FieldLabel>
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
        <PrimaryButton type="submit" isLoading={isSubmitting}>Update password</PrimaryButton>
      </form>
    </PageShell>
  );
}
