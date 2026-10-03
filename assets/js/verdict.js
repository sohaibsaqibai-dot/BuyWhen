// "Is now the right time to buy?" — the Buy / Wait verdict.
import { formatPrice, formatPercent } from './format.js';

// ---- Tune the verdict here -------------------------------------------------
export const RULES = {
  minPoints: 3,          // need at least this many price points...
  minDays: 2,            // ...spread over at least this many days before judging
  nearLowPct: 0.03,      // within 3% of the lowest seen price  -> BUY
  aboveUsualPct: 0.10,   // 10%+ above the usual (median) price -> WAIT
  risingPct: 0.05        // just rose 5%+ vs previous price      -> hint it may fall back
};
// ---------------------------------------------------------------------------

export function priceStats(history) {
  const prices = (history || []).map(h => h.p).filter(Number.isFinite);
  if (!prices.length) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const first = history[0].t;
  const last = history[history.length - 1].t;
  return {
    low: sorted[0],
    high: sorted[sorted.length - 1],
    usual: median,
    count: prices.length,
    days: (last - first) / 86400000,
    since: first
  };
}

/**
 * Returns { code, label, reason }.
 * code: 'buy' | 'wait' | 'fair' | 'tracking' | 'unknown'
 */
export function getVerdict(product) {
  const price = product.currentPrice;
  const cur = product.currency;
  const target = product.targetPrice;
  const fmt = v => formatPrice(v, cur);

  if (price == null) {
    return { code: 'unknown', label: 'No price', reason: 'Open the product page so BuyWhen can read the price.' };
  }

  // 1. The shopper's own limit always wins.
  if (target != null && price <= target) {
    return { code: 'buy', label: 'Buy now', reason: `At or below your target of ${fmt(target)}.` };
  }

  const s = priceStats(product.history);
  const toTarget = target != null ? ` ${fmt(price - target)} above your target.` : '';

  // 2. Too little history to judge fairly.
  if (!s || s.count < RULES.minPoints || s.days < RULES.minDays) {
    return { code: 'tracking', label: 'Watching', reason: `Collecting price history.${toTarget}`.trim() };
  }

  const aboveLow = (price - s.low) / s.low;
  const vsUsual = (price - s.usual) / s.usual;

  // 3. Near the best price ever seen.
  if (aboveLow <= RULES.nearLowPct) {
    const how = price <= s.low ? 'the lowest price seen so far' : `${formatPercent(aboveLow)} above the lowest seen (${fmt(s.low)})`;
    return { code: 'buy', label: 'Good time', reason: `Now ${how}.` };
  }

  // 4. Clearly expensive compared with its usual price.
  if (vsUsual >= RULES.aboveUsualPct) {
    return { code: 'wait', label: 'Wait', reason: `${formatPercent(vsUsual)} above its usual price of ${fmt(s.usual)}. Lowest seen: ${fmt(s.low)}.` };
  }

  // 5. Just jumped up — likely to come back down.
  const prev = product.previousPrice;
  if (prev && (price - prev) / prev >= RULES.risingPct) {
    return { code: 'wait', label: 'Wait', reason: `Just rose ${formatPercent((price - prev) / prev)} from ${fmt(prev)}. Prices often fall back after a jump.` };
  }

  return { code: 'fair', label: 'Fair price', reason: `Close to its usual price of ${fmt(s.usual)}. Lowest seen: ${fmt(s.low)}.${toTarget}` };
}
