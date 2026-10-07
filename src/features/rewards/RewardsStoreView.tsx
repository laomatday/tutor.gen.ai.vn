import { useState } from 'react';
import { Alert, Badge, Button, Card, Icon, Modal } from '../../components/ui';
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
  return <Card className="p-5 sm:p-6">
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
      <div className="max-w-xl"><Badge tone="primary">Ghi nhận nỗ lực học tập</Badge><h1 className="mt-4 text-2xl font-bold tracking-tight text-primary sm:text-3xl">Kho quà thành tích</h1><p className="mt-3 text-sm leading-7 text-on-surface-variant">Tích lũy GP qua việc hoàn thành bài học và tự giải bài tập.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:min-w-96">
        <div className="rounded-xl bg-surface-container-low p-4"><p className="flex items-center justify-between gap-4 text-sm text-on-surface-variant">Số dư GP <Icon name="account_balance_wallet" /></p><p className="mt-3 text-3xl font-bold text-primary">{balance.toLocaleString(appConfig.locale)} <span className="text-base font-medium">GP</span></p><p className="mt-2 text-xs text-secondary">Sẵn sàng đổi quà mẫu</p></div>
        <div className="rounded-xl bg-surface-container-low p-4"><p className="text-sm text-on-surface-variant">GP nhận hôm nay</p><p className="mt-3 text-2xl font-bold">{dailyGp}<span className="text-sm font-medium text-on-surface-variant"> / {limit} GP</span></p><progress className="ui-progress mt-3 w-full accent-secondary" max={100} value={rewardProgress(dailyGp, limit)} aria-label="Hạn mức GP nhận hôm nay" /><p className="mt-1 text-xs text-on-surface-variant">Còn {Math.max(0, limit - dailyGp)} GP trong hạn mức</p></div>
      </div>
    </div>
  </Card>;
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

  return <div className="space-y-6 pb-8">
    <RewardWallet balance={gpBalance} dailyGp={dailyGp} />
    <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div><h2 className="flex items-center gap-2 font-bold"><Icon name="redeem" className="text-secondary" />Trải nghiệm đổi quà</h2><p className="mt-2 text-sm text-on-surface-variant">Danh mục và yêu cầu hiện dùng dữ liệu mẫu, được lưu trên trình duyệt.</p></div><Button variant="secondary" onClick={() => setShowFlow(true)}><Icon name="account_tree" />Xem quy trình</Button></Card>
    {storageError && <Alert tone="warning">{storageError}</Alert>}
    {confirmation && <div role="status"><Alert tone="success">{confirmation}</Alert></div>}
    <section aria-labelledby="reward-catalog-heading" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><h2 id="reward-catalog-heading" className="text-xl font-bold">Chọn phần thưởng</h2><div className="flex flex-wrap gap-2" role="group" aria-label="Lọc phần thưởng">{rewardFilters.map(option => <Button key={option.id} variant={filter === option.id ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(option.id)} aria-pressed={filter === option.id}>{option.label}{option.id === 'ready' ? ` (${readyCount})` : ''}</Button>)}</div></div>
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
