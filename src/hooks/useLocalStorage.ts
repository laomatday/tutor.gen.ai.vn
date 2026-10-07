import { useEffect, useState } from 'react';
import { browserStorage, readStoredValue } from '../lib/browserStorage';

/** Browser-only demo state. Invalid or inaccessible storage never blocks a page. */
export function useLocalStorage<T>(key: string, initialValue: T, validate?: (value: unknown) => value is T) {
  const [initial] = useState(() => readStoredValue(browserStorage, key, initialValue, validate));
  const [value, setValue] = useState<T>(initial.value);
  const [writeError, setWriteError] = useState<string | null>(null);

  useEffect(() => {
    try {
      browserStorage.write(key, JSON.stringify(value));
      setWriteError(null);
    } catch {
      setWriteError('Trình duyệt không cho phép lưu dữ liệu. Thay đổi chỉ được giữ trong phiên hiện tại.');
    }
  }, [key, value]);

  return [value, setValue, writeError ?? initial.error] as const;
}
