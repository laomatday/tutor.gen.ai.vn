import { appConfig } from '../config/app';

export function localDate(offset = 0, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: appConfig.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (part: string) => parts.find(item => item.type === part)!.value;
  const day = new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
}

export const formatDate = (date: string) => new Intl.DateTimeFormat(appConfig.locale, {
  timeZone: appConfig.timeZone,
}).format(new Date(`${date}T12:00:00Z`));
