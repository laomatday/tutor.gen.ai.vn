/** Shared Vietnamese search semantics for every list and picker. */
export const normalizeSearch = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi');
