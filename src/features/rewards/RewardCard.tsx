import { RichMathText } from '../../components/MathLatex';
import { Badge, Button, Card, Icon } from '../../components/ui';
import { appConfig } from '../../config/app';
import type { RewardItem } from './data';
import { canRedeem, rewardProgress } from './domain';

export function RewardCard({ item, balance, stock, onRedeem, onPractice }: {
  item: RewardItem; balance: number; stock: number; onRedeem: () => void; onPractice: () => void;
}) {
  const affordable = canRedeem(balance, item.cost, stock);
  const shortage = Math.max(0, item.cost - balance);
  const progress = rewardProgress(balance, item.cost);

  return <Card className="flex min-w-0 flex-col overflow-hidden">
    <div className={`reward-artwork reward-artwork--${item.category}`} aria-hidden="true">
      <span className="reward-artwork__halo" />
      <span className="reward-artwork__icon">
        <Icon name={item.badgeIcon} />
      </span>
      <span className="reward-artwork__spark reward-artwork__spark--a" />
      <span className="reward-artwork__spark reward-artwork__spark--b" />
      <div className="absolute left-3 top-3">
        <Badge tone={item.featured ? 'success' : 'neutral'}>
          <Icon name={item.badgeIcon} className="text-sm" />
          {item.badgeText}
        </Badge>
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-2xl font-bold text-primary">{item.cost.toLocaleString(appConfig.locale)} GP</span>
        <Badge tone={!stock ? 'neutral' : affordable ? 'success' : 'warning'}>
          {!stock ? 'Hết quà mẫu' : affordable ? 'Đủ điểm đổi' : `Thiếu ${shortage} GP`}
        </Badge>
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold">{item.name}</h2>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">
          <RichMathText text={item.description} />
        </p>
      </div>
      <p className="text-xs text-on-surface-variant">Danh mục mẫu · Còn {stock} {item.unit}</p>
      {!affordable && stock > 0 && (
        <div>
          <div className="mb-2 flex justify-between gap-2 text-xs text-on-surface-variant">
            <span>Tiến độ tích lũy</span>
            <span>{balance}/{item.cost} GP · {progress}%</span>
          </div>
          <progress
            className="ui-progress w-full accent-primary"
            value={progress}
            max={100}
            aria-label={`Tiến độ tích điểm cho ${item.name}`}
          />
        </div>
      )}
      {affordable ? (
        <Button onClick={onRedeem} className="w-full">
          <Icon name="redeem" />
          Đổi ngay ({item.cost} GP)
        </Button>
      ) : (
        <Button variant="secondary" onClick={onPractice} disabled={!stock} className="w-full">
          <Icon name="school" />
          {stock ? 'Luyện tập để tích điểm' : 'Đã hết quà mẫu'}
        </Button>
      )}
    </div>
  </Card>;
}
