import { useEffect, useMemo, useState } from 'react';
import {
  createShop,
  createUser,
  getNigeriaLocations,
  searchUsers,
  type AdminUserSummary,
} from '../../api/adminApi';
import { ApiError } from '../../lib/apiClient';
import { useRouter } from '../../lib/router';
import {
  ErrorBanner,
  FieldLabel,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  TextInput,
} from '../../components/ui';

const STEPS = ['Owner', 'Shop details', 'Review'] as const;
const COUNTRY_OPTIONS = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'United Kingdom',
  'United States',
  'Canada',
  'United Arab Emirates',
  'Other',
];

type NigeriaLocations = Record<string, string[]>;

function selectClass() {
  return 'w-full rounded-lg border border-[var(--hive-border)] bg-white px-3.5 py-2.5 text-[15px] text-[#17191c]';
}

export default function AdminRegisterShopWizard() {
  const { navigate } = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [ownerMode, setOwnerMode] = useState<'new' | 'existing'>('new');
  const [ownerAccountType, setOwnerAccountType] = useState<'email' | 'phone'>('email');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [existingQuery, setExistingQuery] = useState('');
  const [existingResults, setExistingResults] = useState<AdminUserSummary[]>([]);
  const [selectedExistingUser, setSelectedExistingUser] = useState<AdminUserSummary | null>(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopType, setShopType] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');
  const [slogan, setSlogan] = useState('');
  const [website, setWebsite] = useState('');
  const [university, setUniversity] = useState('');
  const [areaName, setAreaName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [countryChoice, setCountryChoice] = useState('Nigeria');
  const [otherCountry, setOtherCountry] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [nigeriaLocations, setNigeriaLocations] = useState<NigeriaLocations | null>(null);
  const [locationDataError, setLocationDataError] = useState<string | null>(null);
  const [operatingMode, setOperatingMode] = useState<'FIXED' | 'FLEXIBLE'>('FIXED');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [shopImage, setShopImage] = useState<File | null>(null);
  const [shopBanner, setShopBanner] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(
    () => categoriesInput.split(',').map((category) => category.trim()).filter(Boolean),
    [categoriesInput],
  );
  const country = countryChoice === 'Other' ? otherCountry.trim() : countryChoice;
  const nigeriaStateOptions = Object.keys(nigeriaLocations ?? {});
  const nigeriaLgaOptions = nigeriaLocations?.[state] ?? [];

  useEffect(() => {
    let cancelled = false;
    getNigeriaLocations()
      .then((data) => {
        if (!cancelled) setNigeriaLocations(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLocationDataError(err instanceof Error ? err.message : 'Unable to load Nigerian location data.');
        }
      });
    return () => { cancelled = true; };
  }, []);

  function toAmPmTime(time: string): string | undefined {
    if (!time) return undefined;
    const [hoursText, minutes] = time.split(':');
    const hours = Number(hoursText);
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${minutes} ${period}`;
  }

  async function handleSearchExisting() {
    setIsSearchingUsers(true);
    setError(null);
    try {
      setExistingResults(await searchUsers(existingQuery.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not search users.');
    } finally {
      setIsSearchingUsers(false);
    }
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (ownerMode === 'new') {
        if (!ownerFullName.trim() || (!ownerPassword && !createdUserId)) {
          return "Please fill in the owner's full name and an initial password.";
        }
        if (ownerAccountType === 'email' && !ownerEmail.trim()) {
          return "Please provide the owner's email address.";
        }
        if (ownerAccountType === 'phone' && !ownerPhone.trim()) {
          return "Please provide the owner's phone number.";
        }
        if (!createdUserId && ownerPassword.length < 8) return 'Password must be at least 8 characters.';
      } else if (!selectedExistingUser || selectedExistingUser.hasShop) {
        return 'Please search for and select an existing owner.';
      }
    }

    if (current === 1) {
      if (!shopName.trim() || !shopPhone.trim() || !shopType.trim()) {
        return 'Please fill in shop name, phone, and shop type.';
      }
      if (!address.trim()) return 'Please enter the shop street, market, campus, or area address.';
      if (!latitude.trim() || !longitude.trim()) return 'Please provide the shop GPS coordinates.';
      const lat = Number(latitude);
      const lon = Number(longitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
        return 'Enter valid latitude and longitude coordinates.';
      }
      if (!country || !state.trim() || !lga.trim()) {
        return 'Please select or enter the shop country, state/region, and LGA/district.';
      }
      if (country.toLowerCase() === 'nigeria') {
        if (locationDataError || !nigeriaLocations) {
          return locationDataError || 'Nigerian state and LGA data is still loading.';
        }
        if (!nigeriaLocations[state]?.includes(lga)) {
          return 'Choose an LGA listed under the selected Nigerian state.';
        }
      }
    }
    return null;
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    const validationError = validateStep(0) || validateStep(1);
    if (validationError) {
      setError(validationError);
      setStep(validationError.includes('owner') || validationError.includes('Owner') ? 0 : 1);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      let userId = selectedExistingUser?.id || createdUserId;
      if (!userId && ownerMode === 'new') {
        const user = await createUser({
          fullName: ownerFullName.trim(),
          email: ownerAccountType === 'email' ? ownerEmail.trim() : undefined,
          phone: ownerPhone.trim() || undefined,
          password: ownerPassword,
        });
        userId = user.id;
        setCreatedUserId(user.id);
        setOwnerPassword('');
      }
      if (!userId) throw new Error('No owner selected.');

      const shop = await createShop({
        userId,
        name: shopName.trim(),
        phone: shopPhone.trim(),
        slogan: slogan.trim() || undefined,
        shopType: shopType.trim(),
        categories,
        university: university.trim() || undefined,
        areaName: areaName.trim() || undefined,
        website: website.trim() || undefined,
        openingTime: toAmPmTime(openingTime),
        closingTime: toAmPmTime(closingTime),
        operatingMode,
        address: address.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        country,
        state: state.trim(),
        lga: lga.trim(),
        image: shopImage,
        banner: shopBanner,
      });
      navigate(`/admin/shops/${encodeURIComponent(shop.id)}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong while registering the shop.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const locationFields = (
    <>
      <div>
        <FieldLabel>Country</FieldLabel>
        <select
          className={selectClass()}
          value={countryChoice}
          onChange={(event) => {
            setCountryChoice(event.target.value);
            setOtherCountry('');
            setState('');
            setLga('');
          }}
        >
          {COUNTRY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
      {countryChoice === 'Other' && (
        <div>
          <FieldLabel>Country name</FieldLabel>
          <TextInput value={otherCountry} onChange={(event) => setOtherCountry(event.target.value)} />
        </div>
      )}
      {country.toLowerCase() === 'nigeria' ? (
        <>
          {locationDataError && <p className="text-sm text-red-700">{locationDataError}</p>}
          <div>
            <FieldLabel>State / region</FieldLabel>
            <select
              className={selectClass()}
              value={state}
              disabled={!nigeriaLocations}
              onChange={(event) => {
                setState(event.target.value);
                setLga('');
              }}
            >
              <option value="">Select a state or FCT</option>
              {nigeriaStateOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>LGA</FieldLabel>
            <select
              className={selectClass()}
              value={lga}
              disabled={!state || !nigeriaLocations}
              onChange={(event) => setLga(event.target.value)}
            >
              <option value="">Select a Local Government Area</option>
              {nigeriaLgaOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </>
      ) : (
        <>
          <div>
            <FieldLabel>State / region</FieldLabel>
            <TextInput value={state} onChange={(event) => { setState(event.target.value); setLga(''); }} />
          </div>
          <div>
            <FieldLabel>LGA / district</FieldLabel>
            <TextInput value={lga} onChange={(event) => setLga(event.target.value)} />
          </div>
        </>
      )}
    </>
  );

  return (
    <PageShell
      title="Register a shop"
      subtitle="Register the shop and its location first. Products and services can be added from its management page."
      maxWidth="max-w-xl"
    >
      <div className="mb-6 flex gap-1.5">
        {STEPS.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${index <= step ? 'bg-[#008100]' : 'bg-gray-200'}`} />
            <p className={`mt-1 text-[11px] font-medium ${index === step ? 'text-[#008100]' : 'text-gray-400'}`}>{label}</p>
          </div>
        ))}
      </div>

      <ErrorBanner message={error} />

      {step === 0 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['new', 'existing'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setOwnerMode(mode)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${ownerMode === mode
                  ? 'border-[#008100] bg-[#e8f5e9] text-[#008100]' : 'border-[var(--hive-border)] text-gray-600'}`}
              >
                {mode === 'new' ? 'New owner' : 'Existing user'}
              </button>
            ))}
          </div>

          {ownerMode === 'new' ? (
            <>
              <div className="flex gap-2">
                {(['email', 'phone'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOwnerAccountType(type)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${ownerAccountType === type
                      ? 'border-[#008100] bg-[#e8f5e9] text-[#008100]' : 'border-[var(--hive-border)] text-gray-600'}`}
                  >
                    {type === 'email' ? 'Email account' : 'Phone-only account'}
                  </button>
                ))}
              </div>
              <div><FieldLabel>Full name</FieldLabel><TextInput value={ownerFullName} onChange={(event) => setOwnerFullName(event.target.value)} /></div>
              {ownerAccountType === 'email' && (
                <div><FieldLabel>Email</FieldLabel><TextInput type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} /></div>
              )}
              <div>
                <FieldLabel>{ownerAccountType === 'phone' ? 'Owner phone number' : 'Phone (optional)'}</FieldLabel>
                <TextInput type="tel" value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} placeholder="+2348012345678 or 08012345678" />
              </div>
              <div>
                <FieldLabel>Temporary initial password (min. 8 characters)</FieldLabel>
                <TextInput type="password" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} autoComplete="new-password" />
                <p className="mt-1 text-xs text-gray-500">Communicate this password to the owner privately.</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <TextInput
                  aria-label="Search existing owners"
                  placeholder="Search by name or email"
                  value={existingQuery}
                  onChange={(event) => setExistingQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void handleSearchExisting(); }}
                />
                <SecondaryButton type="button" className="w-auto px-4" onClick={() => void handleSearchExisting()} disabled={isSearchingUsers}>
                  Search
                </SecondaryButton>
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {existingResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    disabled={user.hasShop}
                    onClick={() => setSelectedExistingUser(user)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60 ${selectedExistingUser?.id === user.id
                      ? 'border-[#008100] bg-[#e8f5e9]' : 'border-[var(--hive-border)]'}`}
                  >
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-gray-500">{user.email || user.phone || 'Phone-only account'}</p>
                    {user.hasShop && <p className="text-xs text-amber-700">This owner already has a shop.</p>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div><FieldLabel>Shop name</FieldLabel><TextInput value={shopName} onChange={(event) => setShopName(event.target.value)} /></div>
          <div><FieldLabel>Shop phone</FieldLabel><TextInput value={shopPhone} onChange={(event) => setShopPhone(event.target.value)} /></div>
          <div><FieldLabel>Shop type</FieldLabel><TextInput value={shopType} onChange={(event) => setShopType(event.target.value)} placeholder="e.g. Fashion, Food" /></div>
          <div><FieldLabel>Categories (comma-separated, optional)</FieldLabel><TextInput value={categoriesInput} onChange={(event) => setCategoriesInput(event.target.value)} /></div>
          <div><FieldLabel>Slogan (optional)</FieldLabel><TextInput value={slogan} onChange={(event) => setSlogan(event.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>University / region (optional)</FieldLabel><TextInput value={university} onChange={(event) => setUniversity(event.target.value)} /></div>
            <div><FieldLabel>Area name (optional)</FieldLabel><TextInput value={areaName} onChange={(event) => setAreaName(event.target.value)} /></div>
          </div>
          <div><FieldLabel>Website (optional)</FieldLabel><TextInput value={website} onChange={(event) => setWebsite(event.target.value)} /></div>
          <div><FieldLabel>Specific location / address</FieldLabel><TextInput value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, neighbourhood, market, campus, or shopping complex" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Latitude</FieldLabel><TextInput inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)} /></div>
            <div><FieldLabel>Longitude</FieldLabel><TextInput inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)} /></div>
          </div>
          <SecondaryButton
            type="button"
            onClick={() => {
              if (!navigator.geolocation) {
                setError('This browser does not support location detection. Enter GPS coordinates manually.');
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setLatitude(String(position.coords.latitude));
                  setLongitude(String(position.coords.longitude));
                  setError(null);
                },
                () => setError('Unable to detect GPS coordinates. Enter them manually or allow location access.'),
              );
            }}
          >
            Use my current GPS location
          </SecondaryButton>
          {locationFields}
          <div>
            <FieldLabel>Operating mode</FieldLabel>
            <select className={selectClass()} value={operatingMode} onChange={(event) => setOperatingMode(event.target.value as 'FIXED' | 'FLEXIBLE')}>
              <option value="FIXED">Fixed hours</option>
              <option value="FLEXIBLE">Flexible hours</option>
            </select>
          </div>
          {operatingMode === 'FIXED' && (
            <div className="grid grid-cols-2 gap-3">
              <div><FieldLabel>Opening time</FieldLabel><TextInput type="time" value={openingTime} onChange={(event) => setOpeningTime(event.target.value)} /></div>
              <div><FieldLabel>Closing time</FieldLabel><TextInput type="time" value={closingTime} onChange={(event) => setClosingTime(event.target.value)} /></div>
            </div>
          )}
          <div><FieldLabel>Shop image (optional)</FieldLabel><input type="file" accept="image/*" onChange={(event) => setShopImage(event.target.files?.[0] || null)} /></div>
          <div><FieldLabel>Shop banner (optional)</FieldLabel><input type="file" accept="image/*" onChange={(event) => setShopBanner(event.target.files?.[0] || null)} /></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-[var(--hive-background)] p-4">
            <p className="font-semibold">Owner</p>
            <p>{ownerMode === 'new'
              ? `${ownerFullName} (${ownerAccountType === 'phone' ? ownerPhone : ownerEmail})`
              : `${selectedExistingUser?.fullName} (${selectedExistingUser?.email || selectedExistingUser?.phone})`}</p>
          </div>
          <div className="rounded-lg bg-[var(--hive-background)] p-4">
            <p className="font-semibold">Shop</p>
            <p>{shopName} — {shopType}</p>
            <p>{address}</p>
            <p>{[areaName, lga, state, country].filter(Boolean).join(', ')}</p>
            <p className="mt-2 text-gray-600">The shop will be registered without products or services. You can manage those separately after registration.</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <SecondaryButton type="button" onClick={() => { setError(null); setStep((current) => current - 1); }} disabled={isSubmitting}>
            Back
          </SecondaryButton>
        )}
        {step < STEPS.length - 1 ? (
          <PrimaryButton type="button" onClick={goNext}>Continue</PrimaryButton>
        ) : (
          <PrimaryButton type="button" onClick={() => void handleSubmit()} isLoading={isSubmitting}>
            Register shop
          </PrimaryButton>
        )}
      </div>
    </PageShell>
  );
}
