import { useState } from 'react';
import { RichMathText } from '../../components/MathLatex';
import { Badge, Button, Card, Icon } from '../../components/ui';
import { appConfig } from '../../config/app';
import type { RewardItem } from './data';
import { canRedeem, rewardProgress } from './domain';

export function RewardCard({ item, balance, stock, onRedeem, onPractice }: {
  item: RewardItem; balance: number; stock: number; onRedeem: () => void; onPractice: () => void;
}) {
  const affordable = canRedeem(balance, item.cost, stock);
  const [imageFailed, setImageFailed] = useState(false);
  const shortage = Math.max(0, item.cost - balance);
  const progress = rewardProgress(balance, item.cost);
  return <Card className="flex min-w-0 flex-col overflow-hidden">
    <div className="relative h-48 bg-surface-container-low">
      {imageFailed ? <div className="flex h-full items-center justify-center text-primary/40" aria-hidden="true"><Icon name={item.badgeIcon} className="text-6xl" /></div> : <img className="h-full w-full object-cover" src={item.image} alt={item.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />}
      <div className="absolute left-3 top-3"><Badge tone={item.featured ? 'success' : 'neutral'}><Icon name={item.badgeIcon} className="text-sm" />{item.badgeText}</Badge></div>
    </div>
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-2xl font-bold text-primary">{item.cost.toLocaleString(appConfig.locale)} GP</span><Badge tone={!stock ? 'neutral' : affordable ? 'success' : 'warning'}>{!stock ? 'Hết quà mẫu' : affordable ? 'Đủ điểm đổi' : `Thiếu ${shortage} GP`}</Badge></div>
      <div className="flex-1"><h2 className="text-lg font-bold">{item.name}</h2><p className="mt-2 text-sm leading-7 text-on-surface-variant"><RichMathText text={item.description} /></p></div>
      <p className="text-xs text-on-surface-variant">Danh mục mẫu · Còn {stock} {item.unit}</p>
      {!affordable && stock > 0 && <div><div className="mb-2 flex justify-between gap-2 text-xs text-on-surface-variant"><span>Tiến độ tích lũy</span><span>{balance}/{item.cost} GP · {progress}%</span></div><progress className="ui-progress w-full accent-primary" value={progress} max={100} aria-label={`Tiến độ tích điểm cho ${item.name}`} /></div>}
      {affordable ? <Button onClick={onRedeem} className="w-full"><Icon name="redeem" />Đổi ngay ({item.cost} GP)</Button> :
        <Button variant="secondary" onClick={onPractice} disabled={!stock} className="w-full"><Icon name="school" />{stock ? 'Luyện tập để tích điểm' : 'Đã hết quà mẫu'}</Button>}
    </div>
  </Card>;
}
