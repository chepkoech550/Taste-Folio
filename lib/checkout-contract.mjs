/** Parse an explicit USD price without floating-point rounding. */
export function usdCents(value) {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d{0,4})(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return cents >= 1 && cents <= 1000000 ? cents : null;
}
export function flashUsername(address) {
  if (typeof address !== 'string') return null;
  const match = /^([a-z0-9_][a-z0-9_.-]{0,49})@flashapp\.me$/i.exec(address.trim());
  return match ? match[1].toLowerCase() : null;
}
export function usdLabel(cents) { return 'USD ' + (cents / 100).toFixed(2); }
export function offerPrice(offer) { const cents = usdCents(offer.usdPrice); return cents === null ? offer.price || 'Let’s discuss' : usdLabel(cents); }
export function checkoutEnabled(profile, offer) { return usdCents(offer.usdPrice) !== null && !!flashUsername(profile.lightning); }
