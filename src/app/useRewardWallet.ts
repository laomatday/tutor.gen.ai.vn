import { useRef } from "react";
import { appConfig } from "../config/app";
import { storageKeys } from "../config/storage";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { localDate } from "../lib/dates";

export function allowedReward(
  amount: number,
  earnedToday: number,
  limit = appConfig.rewards.dailyLimit,
): number {
  return Number.isFinite(amount) && amount > 0
    ? Math.min(Math.floor(amount), Math.max(0, limit - earnedToday))
    : 0;
}
export function validSpend(cost: number, balance: number) {
  return Number.isSafeInteger(cost) && cost > 0 && cost <= balance;
}
const isBalance = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const isDaily = (value: unknown): value is { date: string; amount: number } =>
  Boolean(
    value &&
    typeof value === "object" &&
    "date" in value &&
    typeof value.date === "string" &&
    "amount" in value &&
    isBalance(value.amount),
  );

export function useRewardWallet(notify: (message: string) => void) {
  const [balance, setBalance, balanceError] = useLocalStorage<number>(
    storageKeys.studentGp,
    appConfig.rewards.initialBalance,
    isBalance,
  );
  const [daily, setDaily, dailyError] = useLocalStorage(
    storageKeys.dailyGp,
    {
      date: localDate(),
      amount: appConfig.rewards.initialDailyEarned as number,
    },
    isDaily,
  );
  const current = useRef({ balance, daily });
  current.current = { balance, daily };
  const earn = (amount: number, reason: string) => {
    const today = localDate();
    const earnedToday =
      current.current.daily.date === today ? current.current.daily.amount : 0;
    const granted = allowedReward(amount, earnedToday);
    const next = {
      balance: current.current.balance + granted,
      daily: {
        date: today,
        amount: Math.min(appConfig.rewards.dailyLimit, earnedToday + granted),
      },
    };
    current.current = next;
    setBalance(next.balance);
    setDaily(next.daily);
    notify(`+${granted} GP: ${reason}`);
  };
  const spend = (cost: number, itemName: string): boolean => {
    if (!validSpend(cost, current.current.balance)) {
      notify("Điểm hiện có chưa đủ để đổi phần quà này.");
      return false;
    }
    const nextBalance = current.current.balance - cost;
    current.current = { ...current.current, balance: nextBalance };
    setBalance(nextBalance);
    notify(`Đã giữ ${cost} GP cho yêu cầu đổi "${itemName}".`);
    return true;
  };
  return {
    balance,
    dailyGp:
      daily.date === localDate()
        ? Math.min(appConfig.rewards.dailyLimit, daily.amount)
        : 0,
    earn,
    spend,
    error: balanceError ?? dailyError,
  };
}
