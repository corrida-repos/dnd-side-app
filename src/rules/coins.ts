export type Denom = 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
export type Purse = Record<Denom, number>;

export const DENOMS: Denom[] = ['pp', 'gp', 'ep', 'sp', 'cp'];
/** Value of one coin in GP. */
export const COIN_GP: Record<Denom, number> = { cp: 0.01, sp: 0.1, ep: 0.5, gp: 1, pp: 10 };
export const DENOM_LABEL: Record<Denom, string> = { pp: 'Platinum', gp: 'Gold', ep: 'Electrum', sp: 'Silver', cp: 'Copper' };

export const emptyPurse = (): Purse => ({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
const toCp = (p: Purse) => p.cp + p.sp * 10 + p.ep * 50 + p.gp * 100 + p.pp * 1000;

export const purseValue = (p: Purse): number => Math.round(toCp(p)) / 100;
export const coinCount = (p: Purse): number => p.cp + p.sp + p.ep + p.gp + p.pp;

/** Turns a GP amount into coins: gold first, then silver and copper for the rest. */
export function coinsFor(gp: number): Purse {
  let cp = Math.round(Math.max(0, gp) * 100);
  const p = emptyPurse();
  p.gp = Math.floor(cp / 100);
  cp -= p.gp * 100;
  p.sp = Math.floor(cp / 10);
  p.cp = cp - p.sp * 10;
  return p;
}

export function addCoins(a: Purse, b: Purse): Purse {
  return { cp: a.cp + b.cp, sp: a.sp + b.sp, ep: a.ep + b.ep, gp: a.gp + b.gp, pp: a.pp + b.pp };
}

/**
 * Pays an amount from a purse, keeping the big coins where it can and taking change in gold, silver and copper.
 * Returns the new purse and how much couldn't be paid.
 */
export function spend(p: Purse, gp: number): { purse: Purse; short: number } {
  const have = toCp(p);
  const cost = Math.round(Math.max(0, gp) * 100);
  if (cost >= have) return { purse: emptyPurse(), short: Math.round(cost - have) / 100 };
  let left = have - cost;
  const out = emptyPurse();
  for (const d of DENOMS) {
    const v = COIN_GP[d] * 100;
    const n = Math.min(p[d], Math.floor(left / v));
    out[d] = n;
    left -= n * v;
  }
  // Change for what's left comes back as gold, silver and copper.
  return { purse: addCoins(out, coinsFor(left / 100)), short: 0 };
}

/** Swaps coins of one kind for another at face value, minus a moneychanger's fee (taken from the coins received). */
export function exchange(p: Purse, from: Denom, to: Denom, count: number, feePct: number): { purse: Purse; received: number; fee: number } | null {
  if (count <= 0 || count > p[from] || from === to) return null;
  const valueCp = count * COIN_GP[from] * 100;
  const feeCp = Math.round((valueCp * Math.max(0, feePct)) / 100);
  const netCp = valueCp - feeCp;
  const per = COIN_GP[to] * 100;
  const received = Math.floor(netCp / per);
  const leftover = netCp - received * per;
  const purse = { ...p, [from]: p[from] - count };
  purse[to] += received;
  return { purse: addCoins(purse, coinsFor(leftover / 100)), received, fee: feeCp / 100 };
}

export const fmtPurse = (p: Purse): string =>
  DENOMS.filter((d) => p[d])
    .map((d) => `${p[d]} ${d}`)
    .join(', ') || 'no coins';
