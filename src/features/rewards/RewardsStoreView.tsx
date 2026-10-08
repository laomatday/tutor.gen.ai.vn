import { useState } from 'react';
import { Alert, Badge, Button, Card, Icon, Modal } from '../../components/ui';
import { StudentPageHeader, StudentSignalStrip, StudentSectionHeader } from '../../components/student/StudentExperience';
import { appConfig } from '../../config/app';
import { storageKeys } from '../../config/storage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { rewardCatalog, rewardFilters, rewardFlow, type RewardItem } from './data';
import { availableStock, canRedeem, filterRewards, isRewardRequests, rewardProgress, type RewardFilter, type RewardRequest } from './domain';
import { RedemptionDialog } from './RedemptionDialog';
import { RewardCard } from './RewardCard';

interface RewardsStoreViewProps {
  gpBalance: number;
  dailyGp: number;
  onNavigate: (tab: string) => void;
  onSpendGp: (cost: number, itemName: string) => boolean;
}

function RewardWallet({ balance, dailyGp }: { balance: number; dailyGp: number }) {
  const limit = appConfig.rewards.dailyLimit;
  const remaining = Math.max(0, limit - dailyGp);
  return <>
    <StudentPageHeader
      eyebrow="Điểm thưởng"
      icon="workspace_premium"
      title="Nỗ lực học tập phải được nhìn thấy."
      description="GP là tín hiệu ghi nhận hành vi học tốt: hoàn thành mission, tự giải và tự sửa lỗi. Phần thưởng là lớp trải nghiệm sau cùng, không phải mục tiêu học tập chính."
      meta={
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/8 px-3 py-1.5 text-xs font-semibold text-accent-strong">
          <Icon name="auto_awesome" />
          Đang ghi nhận các phần thưởng minh họa
        </span>
      }
    />
    <StudentSignalStrip
      items={[
        { icon: "account_balance_wallet", label: "Số dư", value: `${balance.toLocaleString(appConfig.locale)} GP` },
        { icon: "bolt", label: "GP hôm nay", value: `${dailyGp}/${limit}` },
        { icon: "target", label: "Còn có thể nhận", value: `${remaining} GP` },
        { icon: "workspace_premium", label: "Identity", value: "Problem Solver" },
      ]}
    />
  </>;
}

export function RewardsStoreView({ gpBalance, dailyGp, onNavigate, onSpendGp }: RewardsStoreViewProps) {
  const [filter, setFilter] = useState<RewardFilter>('all');
  const [showFlow, setShowFlow] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RewardItem | null>(null);
  const [requests, setRequests, storageError] = useLocalStorage<RewardRequest[]>(storageKeys.rewardRequests, [], isRewardRequests);
  const [confirmation, setConfirmation] = useState('');
  const rewards = filterRewards(rewardCatalog, filter, gpBalance, requests);
  const readyCount = filterRewards(rewardCatalog, 'ready', gpBalance, requests).length;

  const confirmRedemption = () => {
    if (!selectedItem || !canRedeem(gpBalance, selectedItem.cost, availableStock(selectedItem, requests))) return false;
    if (!onSpendGp(selectedItem.cost, selectedItem.name)) return false;
    const request: RewardRequest = { id: crypto.randomUUID(), itemId: selectedItem.id, itemName: selectedItem.name, cost: selectedItem.cost, createdAt: new Date().toISOString() };
    setRequests(previous => [request, ...previous]);
    setConfirmation(`Đã lưu yêu cầu mẫu: ${selectedItem.name}. Ví GP đã trừ ${selectedItem.cost} điểm.`);
    setSelectedItem(null);
    return true;
  };

  return <div className="learning-os-page">
    <RewardWallet balance={gpBalance} dailyGp={dailyGp} />
    <section className="signal-card signal-card--accent">
      <StudentSectionHeader
        eyebrow="Reward loop"
        title="Hoàn thành bài học để nhận điểm thưởng minh họa."
        description="Danh mục hiện là dữ liệu mẫu được lưu trên thiết bị. Tutor ưu tiên hành vi học tốt hơn việc tích điểm đơn thuần."
        action={<Button variant="secondary" onClick={() => setShowFlow(true)}><Icon name="account_tree" />Xem quy trình</Button>}
      />
    </section>
    {storageError && <Alert tone="warning">{storageError}</Alert>}
    {confirmation && <div role="status"><Alert tone="success">{confirmation}</Alert></div>}
    <section aria-labelledby="reward-catalog-heading" className="space-y-5">
      <StudentSectionHeader
        eyebrow="Reward catalog"
        title="Chọn phần thưởng"
        description="Chỉ hiển thị những phần thưởng phù hợp với số dư và trạng thái hiện tại."
        action={<div className="flex flex-wrap gap-2" role="group" aria-label="Lọc phần thưởng">{rewardFilters.map(option => <Button key={option.id} variant={filter === option.id ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(option.id)} aria-pressed={filter === option.id}>{option.label}{option.id === 'ready' ? ` (${readyCount})` : ''}</Button>)}</div>}
      />
      <p className="text-sm text-on-surface-variant" role="status">{rewards.length} phần thưởng · Số dư khả dụng {gpBalance.toLocaleString(appConfig.locale)} GP</p>
      {rewards.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{rewards.map(item => <RewardCard key={item.id} item={item} balance={gpBalance} stock={availableStock(item, requests)} onRedeem={() => setSelectedItem(item)} onPractice={() => onNavigate('tu-giai')} />)}</div> :
        <Card className="space-y-4 p-8 text-center"><Icon name="redeem" className="text-3xl text-on-surface-variant" /><h3 className="font-semibold">Chưa có phần thưởng phù hợp</h3><p className="text-sm text-on-surface-variant">Tích lũy thêm GP hoặc xem toàn bộ danh mục.</p><Button variant="secondary" onClick={() => setFilter('all')}>Xem tất cả quà</Button></Card>}
    </section>
    {requests.length > 0 && <Card className="p-5 sm:p-6"><h2 className="text-lg font-bold">Lịch sử yêu cầu mẫu</h2><ul className="mt-4 divide-y divide-outline-variant">{requests.map(request => <li key={request.id} className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center"><div><p className="font-medium">{request.itemName}</p><p className="mt-1 text-xs text-on-surface-variant">{new Intl.DateTimeFormat(appConfig.locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: appConfig.timeZone }).format(new Date(request.createdAt))}</p></div><div className="flex items-center gap-3"><span className="font-semibold">−{request.cost} GP</span><Badge>Đã lưu tại thiết bị</Badge></div></li>)}</ul></Card>}
    <Alert tone="info">Hạn mức nhận thưởng là {appConfig.rewards.dailyLimit} GP mỗi ngày. GP được tích lũy từ các hoạt động học tập; không có chức năng nạp tiền mua điểm.</Alert>
    <Modal open={showFlow} onClose={() => setShowFlow(false)} title="Quy trình đổi quà mẫu" description="Bốn bước để thử trải nghiệm đổi thưởng trên thiết bị hiện tại." footer={<Button onClick={() => setShowFlow(false)}>Đã hiểu quy trình</Button>}><ol className="space-y-5">{rewardFlow.map((step, index) => <li key={step.title} className="flex items-start gap-4"><Badge tone="primary">{index + 1}</Badge><div><h3 className="font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-7 text-on-surface-variant">{step.description}</p></div></li>)}</ol></Modal>
    {selectedItem && <RedemptionDialog key={selectedItem.id} item={selectedItem} balance={gpBalance} stock={availableStock(selectedItem, requests)} onClose={() => setSelectedItem(null)} onConfirm={confirmRedemption} />}
  </div>;
}
