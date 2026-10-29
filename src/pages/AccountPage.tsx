import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { PageShell, SecondaryButton } from '../components/ui';
import {
  getPersonalProfile,
  updatePersonalProfile,
  uploadPersonalProfilePicture,
  type PersonalProfile,
} from '../api/shopOwnerApi';

const fieldClass = 'w-full rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2.5 text-sm text-[#17191c]';

export default function AccountPage() {
  const { user, logout, refreshUser } = useAuth();
  const { navigate } = useRouter();
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(() => Boolean(user?.email));
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(() =>
    user?.email ? null : 'A verified email address is required to load this profile with the current backend endpoint.');
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  async function reloadProfile() {
    if (!user?.email) {
      setLoadingProfile(false);
      setProfileError('A verified email address is required to load this profile with the current backend endpoint.');
      return null;
    }
    const updated = await getPersonalProfile(user.email);
    setProfile(updated);
    return updated;
  }

  useEffect(() => {
    let cancelled = false;
    if (!user?.email) return () => { cancelled = true; };
    getPersonalProfile(user.email)
      .then((result) => {
        if (!cancelled) {
          setProfile(result);
          setProfileError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setProfileError(loadError instanceof Error ? loadError.message : 'Unable to load your profile.');
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });
    return () => { cancelled = true; };
  }, [user?.email]);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.email || !profile) {
      setProfileError('Your authenticated profile could not be loaded.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get('full_name') || '').trim();
    if (!fullName) {
      setProfileError('Full name is required.');
      return;
    }
    const latitudeValue = String(form.get('latitude') || '').trim();
    const longitudeValue = String(form.get('longitude') || '').trim();
    const latitude = latitudeValue ? Number(latitudeValue) : null;
    const longitude = longitudeValue ? Number(longitudeValue) : null;
    if ((latitudeValue && !Number.isFinite(latitude)) || (longitudeValue && !Number.isFinite(longitude))) {
      setProfileError('Enter valid numeric coordinates or leave them blank.');
      return;
    }
    const address = String(form.get('address') || '').trim();
    const nextProfile: PersonalProfile = {
      ...profile,
      full_name: fullName,
      university: String(form.get('university') || '').trim() || null,
      campus: String(form.get('campus') || '').trim() || null,
      countryOfResidence: String(form.get('countryOfResidence') || '').trim() || null,
      stateOfResidence: String(form.get('stateOfResidence') || '').trim() || null,
      lgaOfResidence: String(form.get('lgaOfResidence') || '').trim() || null,
      location: address || latitude != null || longitude != null
        ? { address: address || null, latitude, longitude }
        : null,
    };

    setSavingProfile(true);
    setProfileError(null);
    setProfileNotice(null);
    try {
      await updatePersonalProfile({
        userId: user.userId,
        email: user.email,
        full_name: nextProfile.full_name,
        university: nextProfile.university,
        campus: nextProfile.campus,
        countryOfResidence: nextProfile.countryOfResidence,
        stateOfResidence: nextProfile.stateOfResidence,
        lgaOfResidence: nextProfile.lgaOfResidence,
        location: nextProfile.location,
      });
      try {
        await reloadProfile();
        await refreshUser();
        setProfileNotice('Your profile was updated.');
      } catch (refreshError) {
        setProfile(nextProfile);
        setProfileNotice(`Your changes were saved, but the latest profile could not be reloaded: ${refreshError instanceof Error ? refreshError.message : 'Refresh the page to see them.'}`);
      }
    } catch (saveError) {
      setProfileError(saveError instanceof Error ? saveError.message : 'Unable to save your profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    if (!profile || !user?.email) {
      setProfileError('Your authenticated profile must load before you can upload a photo.');
      return;
    }
    if (profile.location?.latitude == null || profile.location.longitude == null) {
      setProfileError('The current profile-photo endpoint requires existing latitude and longitude values. Add your location coordinates before uploading a photo to avoid changing your profile location.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setProfileError('Choose an image file for your profile photo.');
      return;
    }
    setUploadingPhoto(true);
    setProfileError(null);
    setProfileNotice(null);
    try {
      await uploadPersonalProfilePicture({ ...profile, email: user.email }, file);
      await reloadProfile();
      setProfileNotice('Your profile photo was updated.');
    } catch (uploadError) {
      setProfileError(uploadError instanceof Error ? uploadError.message : 'Unable to upload your profile photo.');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  }

  return (
    <PageShell title="Your account" subtitle={user?.email || user?.phone}>
      <div className="space-y-5">
        <a
          href="/shopping"
          onClick={(e) => {
            e.preventDefault();
            navigate('/shopping');
          }}
          className="block rounded-lg bg-[#008100] px-4 py-3 text-center text-[15px] font-semibold text-white hover:bg-[#006d24]"
        >
          Start Shopping
        </a>

        <div className="rounded-lg border border-[var(--hive-border)] bg-[var(--hive-background)] p-4">
          <p className="text-sm text-[#4b5158]">Full name</p>
          <p className="font-semibold text-[#17191c]">{profile?.full_name || user?.fullName || '—'}</p>
        </div>

        <section className="rounded-xl border border-[var(--hive-border)] bg-white p-5">
          <h2 className="text-lg font-bold text-[#17191c]">Personal profile</h2>
          <p className="mt-1 text-sm text-gray-600">These details are loaded and saved using your authenticated HiveMarket account.</p>
          {profileError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{profileError}</p>}
          {profileNotice && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{profileNotice}</p>}
          {loadingProfile ? <p className="mt-4 text-sm text-gray-600">Loading your profile…</p>
            : profile ? (
              <>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  {profile.profile_picture
                    ? <img src={profile.profile_picture} alt="Your profile" className="h-16 w-16 rounded-full object-cover" />
                    : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-2xl font-bold text-[#008100]">{profile.full_name.slice(0, 1) || '?'}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#17191c]">{profile.full_name}</p>
                    <p className="text-sm text-gray-600">{profile.email || user?.email || 'Email unavailable'}</p>
                    <p className="text-sm text-gray-600">{profile.phone || user?.phone || 'Phone number unavailable'}</p>
                  </div>
                  <div>
                    <input ref={photoInputRef} type="file" accept="image/*" aria-label="Choose a profile photo" disabled={uploadingPhoto} onChange={(event) => void uploadPhoto(event.target.files?.[0])} className="max-w-56 text-xs" />
                    {uploadingPhoto && <p className="mt-1 text-xs text-gray-500">Uploading photo…</p>}
                  </div>
                </div>
                <form onSubmit={(event) => void saveProfile(event)} className="mt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-gray-700">Full name
                      <input name="full_name" required maxLength={120} defaultValue={profile.full_name} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">Email
                      <input value={profile.email || user?.email || ''} readOnly className={`${fieldClass} mt-1 bg-gray-50`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">Phone
                      <input value={profile.phone || user?.phone || ''} readOnly className={`${fieldClass} mt-1 bg-gray-50`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">University
                      <input name="university" defaultValue={profile.university || ''} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">Campus
                      <input name="campus" defaultValue={profile.campus || ''} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">Country of residence
                      <input name="countryOfResidence" defaultValue={profile.countryOfResidence || ''} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">State of residence
                      <input name="stateOfResidence" defaultValue={profile.stateOfResidence || ''} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">LGA of residence
                      <input name="lgaOfResidence" defaultValue={profile.lgaOfResidence || ''} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700 sm:col-span-2">Address
                      <input name="address" defaultValue={profile.location?.address || ''} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">Latitude
                      <input name="latitude" type="number" step="any" min="-90" max="90" defaultValue={profile.location?.latitude ?? ''} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">Longitude
                      <input name="longitude" type="number" step="any" min="-180" max="180" defaultValue={profile.location?.longitude ?? ''} className={`${fieldClass} mt-1`} />
                    </label>
                  </div>
                  <p className="text-xs leading-5 text-gray-500">Email and phone are read-only here. Phone number changes are not available in the current profile endpoint.</p>
                  <button type="submit" disabled={savingProfile} className="rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#006d24] disabled:opacity-50">{savingProfile ? 'Saving…' : 'Save profile'}</button>
                </form>
              </>
            ) : <p className="mt-4 text-sm text-gray-600">Profile details could not be loaded.</p>}
        </section>

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
          href="/shop-owner/dashboard"
          onClick={(e) => {
            e.preventDefault();
            navigate('/shop-owner/dashboard');
          }}
          className="block rounded-lg bg-[#008100] px-4 py-2.5 text-center text-[15px] font-semibold text-white hover:bg-[#006d24]"
        >
          Shop owner dashboard
        </a>

        <a
          href="/shop-management"
          onClick={(e) => {
            e.preventDefault();
            navigate('/shop-management');
          }}
          className="block rounded-lg border border-[var(--hive-border)] px-4 py-2.5 text-center text-[15px] font-semibold text-[#17191c] hover:bg-[var(--hive-background)]"
        >
          Manage shop listings
        </a>

        <a
          href="/password-change"
          onClick={(e) => {
            e.preventDefault();
            navigate('/password-change');
          }}
          className="block rounded-lg border border-[var(--hive-border)] px-4 py-2.5 text-center text-[15px] font-semibold text-[#17191c] hover:bg-[var(--hive-background)]"
        >
          Change password
        </a>

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
