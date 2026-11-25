import type { State } from '../state/types';
import { samePlace } from './notoriety';
import { isMapOf } from './tools';

export const CARTOGRAPHER_TOOL = "Cartographer's Tools";
export const MAP_COMMISSION_GP = 25;

export interface MapCommission {
  id: string;
  town: string;
  route: string;
  delivered: boolean;
}

export function commissionSource(s: State, route: string) {
  return s.characters.flatMap((c) => c.inventory)
    .find((item) => item.qty > 0 && !item.damaged && isMapOf(item.name, route));
}

export function commissionRoutes(s: State, town: string): string[] {
  const routes = s.journey.map((stage) => stage.name.trim());
  for (const c of s.characters) {
    for (const item of c.inventory) {
      if (item.qty <= 0 || item.damaged || routes.some((route) => isMapOf(item.name, route))) continue;
      const match = item.name.trim().match(/^map of (.+)$|^map \((.+)\)$|^map:\s*(.+)$|^(.+) map$/i);
      const route = match?.slice(1).find(Boolean)?.trim();
      if (route && !samePlace(route, 'this area')) routes.push(route);
    }
  }
  return routes.filter((route, index) => route &&
    routes.findIndex((other) => samePlace(other, route)) === index &&
    !s.mapCommissions.some((order) => samePlace(order.town, town) && samePlace(order.route, route)));
}
