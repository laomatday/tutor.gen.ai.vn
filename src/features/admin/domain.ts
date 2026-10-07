import type { ManagedUser, ManagedUserDraft, UserRole } from './types';

export const roleLabels: Record<UserRole, string> = { student: 'Học sinh', teacher: 'Giáo viên', admin: 'Quản trị viên' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validUsers(value: unknown): value is ManagedUser[] {
  return Array.isArray(value) && value.every(item => isRecord(item) &&
    ['id', 'name', 'email', 'group'].every(key => typeof item[key] === 'string') &&
    typeof item.active === 'boolean' && typeof item.role === 'string' && Object.hasOwn(roleLabels, item.role)) &&
    new Set(value.map(item => item.id)).size === value.length;
}


export function getUserDraftError(draft: ManagedUserDraft, users: ManagedUser[]): string | null {
  if (draft.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) || !Object.hasOwn(roleLabels, draft.role)) {
    return 'Nhập họ tên từ 2 ký tự, email hợp lệ và chọn một vai trò.';
  }
  if (users.some(user => user.email.trim().toLowerCase() === draft.email.trim().toLowerCase())) {
    return 'Email này đã có trong danh sách. Vui lòng dùng email khác.';
  }
  return null;
}
