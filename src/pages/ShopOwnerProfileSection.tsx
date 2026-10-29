import { useEffect, useState, type FormEvent } from 'react';
import {
  getPersonalProfile,
  getShopOwnerProfile,
  updateShopOwnerProfile,
  uploadPersonalProfilePicture,
  type PersonalProfile,
  type ShopOwnerProfile,
  type ShopOwnerProfileUpdate,
} from '../api/shopOwnerApi';
import { useAuth } from '../lib/AuthContext';

const fieldClass = 'mt-1 w-full rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2.5 text-sm text-[#17191c]';
const labelClass = 'block text-sm font-medium text-gray-700';

function timeForInput(value: string | null): string {
  if (!value) return '';
  const twentyFourHour = value.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFourHour) {
    return `${twentyFourHour[1].padStart(2, '0')}:${twentyFourHour[2]}`;
  }
  const twelveHour = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!twelveHour) return '';
  let hour = Number(twelveHour[1]) % 12;
  if (twelveHour[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${twelveHour[2]}`;
}

function timeForApi(value: string): string {
  if (!value) return '';
  const [rawHour, minute] = value.split(':');
  const hour = Number(rawHour);
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`;
}

export default function ShopOwnerProfileSection({ shopId }: { shopId: string }) {
  const { user } = useAuth();
  const [shop, setShop] = useState<ShopOwnerProfile | null>(null);
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [personalPicture, setPersonalPicture] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setPersonalError(null);
      try {
        const profile = await getShopOwnerProfile(shopId);
        if (!cancelled) setShop(profile);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load this shop profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (user?.email) {
        try {
          const profile = await getPersonalProfile(user.email);
          if (!cancelled) setPersonalProfile(profile);
        } catch (loadError) {
          if (!cancelled) {
            setPersonalError(loadError instanceof Error
              ? loadError.message
              : 'Unable to load your personal profile.');
          }
        }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [shopId, user?.email]);

  async function saveShop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shop) return;
    const form = new FormData(event.currentTarget);
    const latitudeValue = String(form.get('latitude') || '').trim();
    const longitudeValue = String(form.get('longitude') || '').trim();
    const latitude = latitudeValue ? Number(latitudeValue) : undefined;
    const longitude = longitudeValue ? Number(longitudeValue) : undefined;
    if ((latitudeValue && !Number.isFinite(latitude)) || (longitudeValue && !Number.isFinite(longitude))) {
      setError('Enter valid coordinates or leave both coordinate fields blank.');
      return;
    }

    const payload: ShopOwnerProfileUpdate = {
      name: String(form.get('name') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      address: String(form.get('address') || '').trim(),
      latitude,
      longitude,
      isOpen: Boolean(shop.isOpen),
      openTime: timeForApi(String(form.get('openTime') || '')),
      closingTime: timeForApi(String(form.get('closingTime') || '')),
      slogan: String(form.get('slogan') || '').trim(),
      website: String(form.get('website') || '').trim(),
      university: String(form.get('university') || '').trim(),
      areaName: String(form.get('areaName') || '').trim(),
      country: String(form.get('country') || '').trim(),
      state: String(form.get('state') || '').trim(),
      lga: String(form.get('lga') || '').trim(),
      operatingMode: form.get('operatingMode') === 'FLEXIBLE' ? 'FLEXIBLE' : 'FIXED',
      image: form.get('image') instanceof File && (form.get('image') as File).size > 0
        ? form.get('image') as File
        : undefined,
      banner: form.get('banner') instanceof File && (form.get('banner') as File).size > 0
        ? form.get('banner') as File
        : undefined,
    };

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateShopOwnerProfile(shopId, payload);
      setNotice('Shop profile saved.');
      try {
        setShop(await getShopOwnerProfile(shopId));
      } catch (refreshError) {
        setError(`Shop profile was saved, but its latest details could not be reloaded: ${refreshError instanceof Error ? refreshError.message : 'Refresh the page to see the latest details.'}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the shop profile.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadPicture() {
    if (!personalProfile || !personalPicture) return;
    setUploadingPicture(true);
    setError(null);
    setNotice(null);
    try {
      await uploadPersonalProfilePicture(personalProfile, personalPicture);
      const updated = personalProfile.email
        ? await getPersonalProfile(personalProfile.email)
        : personalProfile;
      setPersonalProfile(updated);
      setPersonalPicture(null);
      setNotice('Personal profile picture updated. This is separate from the shop logo and cover image.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload your profile picture.');
    } finally {
      setUploadingPicture(false);
    }
  }

  if (loading) {
    return <p className="rounded-xl border border-[var(--hive-border)] bg-white p-5 text-sm text-gray-600">Loading shop profile…</p>;
  }
  if (error && !shop) {
    return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  }
  if (!shop) return null;

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <form onSubmit={(event) => void saveShop(event)} className="space-y-5 rounded-xl border border-[var(--hive-border)] bg-white p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-[#17191c]">Shop details</h2>
          <p className="mt-1 text-sm text-gray-600">Changes are saved to this shop only.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Shop name
            <input name="name" required defaultValue={shop.name} className={fieldClass} />
          </label>
          <label className={labelClass}>Business phone
            <input name="phone" defaultValue={shop.phone} className={fieldClass} />
          </label>
          <label className={labelClass}>Website
            <input name="website" type="url" defaultValue={shop.website || ''} className={fieldClass} placeholder="https://" />
          </label>
          <label className={labelClass}>Shop tagline
            <input name="slogan" defaultValue={shop.slogan || ''} className={fieldClass} />
          </label>
          <label className={labelClass}>Address
            <input name="address" defaultValue={shop.location?.address || ''} className={fieldClass} />
          </label>
          <label className={labelClass}>Area
            <input name="areaName" defaultValue={shop.areaName || ''} className={fieldClass} />
          </label>
          <label className={labelClass}>University
            <input name="university" defaultValue={shop.university || ''} className={fieldClass} />
          </label>
          <label className={labelClass}>Country
            <input name="country" defaultValue={shop.country || ''} className={fieldClass} />
          </label>
          <label className={labelClass}>State
            <input name="state" defaultValue={shop.state || ''} className={fieldClass} />
          </label>
          <label className={labelClass}>Local government area
            <input name="lga" defaultValue={shop.lga || ''} className={fieldClass} />
          </label>
          <label className={labelClass}>Latitude
            <input name="latitude" type="number" step="any" defaultValue={shop.location?.latitude ?? ''} className={fieldClass} />
          </label>
          <label className={labelClass}>Longitude
            <input name="longitude" type="number" step="any" defaultValue={shop.location?.longitude ?? ''} className={fieldClass} />
          </label>
          <label className={labelClass}>Opening time
            <input name="openTime" type="time" defaultValue={timeForInput(shop.openTime)} className={fieldClass} />
          </label>
          <label className={labelClass}>Closing time
            <input name="closingTime" type="time" defaultValue={timeForInput(shop.closingTime)} className={fieldClass} />
          </label>
          <label className={labelClass}>Operating mode
            <select name="operatingMode" defaultValue={shop.operatingMode || 'FIXED'} className={fieldClass}>
              <option value="FIXED">Fixed hours</option>
              <option value="FLEXIBLE">Flexible hours</option>
            </select>
          </label>
          <div className={labelClass}>
            Shop category
            <p className={`${fieldClass} min-h-11 font-normal text-gray-600`}>
              {shop.categories?.length ? shop.categories.join(', ') : shop.shopType || 'Not set'}
            </p>
            <span className="mt-1 block text-xs font-normal text-gray-500">Category editing is not supported by the current shop update endpoint.</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Shop logo
            {shop.imageUrl && <img src={shop.imageUrl} alt="Current shop logo" className="mb-2 mt-2 h-16 w-16 rounded-lg object-cover" />}
            <input name="image" type="file" accept="image/*" className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[#008100]`} />
          </label>
          <label className={labelClass}>Shop-front cover image
            {shop.banner && <img src={shop.banner} alt="Current shop-front cover" className="mb-2 mt-2 h-20 w-full rounded-lg object-cover" />}
            <input name="banner" type="file" accept="image/*" className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[#008100]`} />
          </label>
        </div>

        <button type="submit" disabled={saving} className="rounded-lg bg-[#008100] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#006d24] disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? 'Saving…' : 'Save shop profile'}
        </button>
      </form>

      <section className="rounded-xl border border-[var(--hive-border)] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-[#17191c]">Personal profile picture</h2>
        <p className="mt-1 text-sm text-gray-600">This belongs to your personal account and is not the shop logo or cover image.</p>
        {personalError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{personalError}</p>}
        {personalProfile ? (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {personalProfile.profile_picture
              ? <img src={personalProfile.profile_picture} alt="Current personal profile" className="h-14 w-14 rounded-full object-cover" />
              : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-500">No photo</div>}
            <input type="file" accept="image/*" onChange={(event) => setPersonalPicture(event.target.files?.[0] || null)} className="min-w-0 flex-1 text-sm" />
            <button type="button" disabled={!personalPicture || uploadingPicture} onClick={() => void uploadPicture()} className="rounded-lg border border-[var(--hive-border)] px-4 py-2 text-sm font-semibold text-[#17191c] disabled:opacity-50">
              {uploadingPicture ? 'Uploading…' : 'Upload personal photo'}
            </button>
          </div>
        ) : !personalError ? (
          <p className="mt-3 text-sm text-gray-600">{user?.email ? 'Loading personal profile…' : 'A verified account email is required to load your personal profile.'}</p>
        ) : null}
      </section>
    </div>
  );
}
