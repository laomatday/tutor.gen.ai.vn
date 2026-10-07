/** The browser persistence boundary. Feature code consumes typed hooks, not localStorage. */
export interface StorageAdapter {
  read(key: string): string | null;
  write(key: string, value: string): void;
}

export const browserStorage: StorageAdapter = {
  read: key => window.localStorage.getItem(key),
  write: (key, value) => window.localStorage.setItem(key, value),
};

export function matchesShape(value: unknown, sample: unknown): boolean {
  if (sample === null) return value === null;
  if (Array.isArray(sample)) return Array.isArray(value)
    && (sample.length === 0 || value.every(item => matchesShape(item, sample[0])));
  if (typeof sample === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.entries(sample).every(([key, field]) => matchesShape((value as Record<string, unknown>)[key], field));
  return typeof value === typeof sample && (typeof value !== 'number' || Number.isFinite(value));
}

export function readStoredValue<T>(adapter: StorageAdapter, key: string, fallback: T, validate?: (value: unknown) => value is T) {
  try {
    const raw = adapter.read(key);
    if (raw === null) return { value: fallback, error: null };
    const parsed: unknown = JSON.parse(raw);
    if (!(validate ? validate(parsed) : matchesShape(parsed, fallback))) throw new Error('Invalid stored data');
    return { value: parsed as T, error: null };
  } catch {
    return { value: fallback, error: 'Không đọc được dữ liệu đã lưu. Trang đang sử dụng dữ liệu mẫu.' };
  }
}
