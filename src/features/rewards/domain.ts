import type { RewardItem } from './data';

export type RewardFilter = 'all' | 'ready' | 'tech' | 'limited';
export type RewardRequest = { id: string; itemId: string; itemName: string; cost: number; createdAt: string };
export type DeliveryDetails = { address: string; parentPhone: string };

export function isRewardRequests(value: unknown): value is RewardRequest[] {
  return Array.isArray(value) && value.every(item => item && typeof item === 'object' &&
    typeof item.id === 'string' && typeof item.itemId === 'string' && typeof item.itemName === 'string' &&
    Number.isSafeInteger(item.cost) && item.cost > 0 && typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)));
}

export function availableStock(item: RewardItem, requests: RewardRequest[]): number {
  return Math.max(0, item.stock - requests.filter(request => request.itemId === item.id).length);
}

export function canRedeem(balance: number, cost: number, stock: number): boolean {
  return Number.isSafeInteger(balance) && Number.isSafeInteger(cost) && Number.isSafeInteger(stock) &&
    balance >= cost && cost > 0 && stock > 0;
}

export function rewardProgress(balance: number, cost: number): number {
  if (!Number.isFinite(balance) || !Number.isFinite(cost) || cost <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(balance / cost * 100)));
}

export function validateDelivery(details: DeliveryDetails): Partial<Record<keyof DeliveryDetails, string>> {
  const errors: Partial<Record<keyof DeliveryDetails, string>> = {};
  if (details.address.trim().length < 10) errors.address = 'Nhập địa chỉ nhận quà đầy đủ (tối thiểu 10 ký tự).';
  const phone = details.parentPhone.replace(/[\s.-]/g, '').replace(/^\+84/, '0');
  if (!/^0\d{9}$/.test(phone)) errors.parentPhone = 'Nhập số điện thoại 10 chữ số hoặc bắt đầu bằng +84.';
  return errors;
}

export function filterRewards(catalog: RewardItem[], filter: RewardFilter, balance: number, requests: RewardRequest[]): RewardItem[] {
  return catalog.filter(item => filter === 'all' ||
    (filter === 'ready' ? canRedeem(balance, item.cost, availableStock(item, requests)) : item.category === filter));
}
