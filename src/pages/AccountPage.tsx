import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { PageShell, SecondaryButton } from '../components/ui';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <PageShell title="Your account" subtitle={user?.email}>
      <div className="space-y-5">
        <div className="rounded-lg border border-[var(--hive-border)] bg-[var(--hive-background)] p-4">
          <p className="text-sm text-[#4b5158]">Full name</p>
          <p className="font-semibold text-[#17191c]">{user?.fullName || '—'}</p>
        </div>

        {user?.isAdmin && (
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              navigate('/admin');
            }}
            className="block rounded-lg bg-[#008100] px-4 py-2.5 text-center text-[15px] font-semibold text-white hover:bg-[#006d24]"
          >
            Open Admin console
          </a>
        )}

        <a
          href="/account-deletion"
          onClick={(e) => {
            e.preventDefault();
            navigate('/account-deletion');
          }}
          className="block rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-[15px] font-semibold text-red-700 hover:bg-red-100"
        >
          Manage deletion
        </a>

        <SecondaryButton type="button" onClick={handleLogout}>
          Sign out
        </SecondaryButton>
      </div>
    </PageShell>
  );
}
