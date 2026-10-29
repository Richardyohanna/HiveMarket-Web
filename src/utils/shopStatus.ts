type ShopHours = {
  isOpen?: boolean | null;
  openTime?: string | null;
  closingTime?: string | null;
};

function parseTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute > 59) return null;
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
}

export function getShopOpenStatus(shop: ShopHours): boolean | null {
  if (typeof shop.isOpen === 'boolean') return shop.isOpen;
  if (!shop.openTime || !shop.closingTime) return null;
  const opening = parseTime(shop.openTime);
  const closing = parseTime(shop.closingTime);
  if (opening == null || closing == null) return null;

  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const hour = Number(timeParts.find((part) => part.type === 'hour')?.value);
  const minute = Number(timeParts.find((part) => part.type === 'minute')?.value);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const now = hour * 60 + minute;
  if (opening === closing) return true;
  return opening < closing ? now >= opening && now < closing : now >= opening || now < closing;
}
