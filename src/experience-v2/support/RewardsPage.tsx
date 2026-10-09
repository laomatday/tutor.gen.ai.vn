import { useState } from "react";
import { Alert, Button, Icon, Modal, Progress } from "../../components/ui";
import { appConfig } from "../../config/app";
import { storageKeys } from "../../config/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { rewardCatalog, rewardFilters, rewardFlow, type RewardItem } from "../../features/rewards/data";
import {
  availableStock,
  canRedeem,
  filterRewards,
  isRewardRequests,
  rewardProgress,
  type RewardFilter,
  type RewardRequest,
} from "../../features/rewards/domain";
import { RedemptionDialog } from "../../features/rewards/RedemptionDialog";
import { SupportHeader } from "./SupportUI";
import "./support-ui.css";

interface Props {
  gpBalance: number;
  dailyGp: number;
  onNavigate: (path: string) => void;
  onSpendGp: (cost: number, itemName: string) => boolean;
}

export function RewardsPage({ gpBalance, dailyGp, onNavigate, onSpendGp }: Props) {
  const [filter, setFilter] = useState<RewardFilter>("all");
  const [selected, setSelected] = useState<RewardItem | null>(null);
  const [showFlow, setShowFlow] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [requests, setRequests, storageError] = useLocalStorage<RewardRequest[]>(
    storageKeys.rewardRequests,
    [],
    isRewardRequests,
  );
  const visible = filterRewards(rewardCatalog, filter, gpBalance, requests);
  const readyCount = filterRewards(rewardCatalog, "ready", gpBalance, requests).length;
  const dailyLimit = appConfig.rewards.dailyLimit;
  const remaining = Math.max(0, dailyLimit - dailyGp);

  function confirmRedemption() {
    if (!selected || !canRedeem(gpBalance, selected.cost, availableStock(selected, requests))) {
      return false;
    }
    if (!onSpendGp(selected.cost, selected.name)) return false;
    setRequests((current) => [{
      id: crypto.randomUUID(),
      itemId: selected.id,
      itemName: selected.name,
      cost: selected.cost,
      createdAt: new Date().toISOString(),
    }, ...current]);
    setConfirmation(`Đã ghi nhận yêu cầu minh họa: ${selected.name}. Trừ ${selected.cost} GP trên thiết bị này.`);
    setSelected(null);
    return true;
  }

  return (
    <div className="v2-support-page v2-rewards-page">
      <SupportHeader
        eyebrow="Phần thưởng thử nghiệm"
        title="Góc tích lũy GP"
        description="Theo dõi điểm đã lưu trên thiết bị và khám phá danh mục quà minh họa. Chưa có duyệt yêu cầu hoặc giao quà thật."
        icon="workspace_premium"
      >
        <Button className="v2-support-on-hero" onClick={() => onNavigate("/tu-giai")}>
          <Icon name="edit_square" /> Tự giải để nhận GP
        </Button>
      </SupportHeader>

      <section className="v2-support-stats" aria-label="Ví điểm và hạn mức thực tế trên thiết bị">
        <div className="v2-support-stat">
          <span><Icon name="account_balance_wallet" /> Số dư GP</span>
          <strong>{gpBalance.toLocaleString(appConfig.locale)} <small>GP</small></strong>
          <p>Điểm được ghi trên trình duyệt này</p>
        </div>
        <div className="v2-support-stat">
          <span><Icon name="bolt" /> GP hôm nay</span>
          <strong>{dailyGp}<small> / {dailyLimit} GP</small></strong>
          <p>Hạn mức nhận GP trong một ngày</p>
        </div>
        <div className="v2-support-stat">
          <span><Icon name="target" /> Còn có thể nhận</span>
          <strong>{remaining} <small>GP</small></strong>
          <p>Không có chức năng nạp tiền để mua điểm</p>
        </div>
      </section>

      <div className="v2-support-demo-notice" role="note">
        <Icon name="info" />
        <p>Danh mục và tồn kho quà là **dữ liệu minh họa**. Bấm đổi quà chỉ lưu yêu cầu và trừ GP trên trình duyệt này, không tạo đơn giao hàng.</p>
        <Button variant="ghost" onClick={() => setShowFlow(true)}>Xem quy trình</Button>
      </div>

      {storageError && <div role="alert"><Alert tone="warning">{storageError}</Alert></div>}
      {confirmation && <div role="status"><Alert tone="success">{confirmation}</Alert></div>}

      <section className="v2-support-panel v2-rewards-catalog" aria-labelledby="v2-rewards-catalog-title">
        <div className="v2-support-panel-heading">
          <div>
            <p className="v2-support-eyebrow">Danh mục mẫu · {visible.length} quà phù hợp bộ lọc</p>
            <h2 id="v2-rewards-catalog-title">Chọn phần thưởng</h2>
          </div>
          <div className="v2-support-filters" role="group" aria-label="Lọc quà minh họa">
            {rewardFilters.map((option) => (
              <Button
                key={option.id}
                variant="ghost"
                size="sm"
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
              >
                {option.label}{option.id === "ready" ? ` (${readyCount})` : ""}
              </Button>
            ))}
          </div>
        </div>
        {visible.length ? (
          <div className="v2-reward-grid">
            {visible.map((item) => {
              const stock = availableStock(item, requests);
              const eligible = canRedeem(gpBalance, item.cost, stock);
              const shortfall = Math.max(0, item.cost - gpBalance);
              return (
                <article key={item.id} className="v2-reward-card" data-category={item.category}>
                  <div className="v2-reward-art">
                    <span className="v2-reward-art-icon"><Icon name={item.badgeIcon} /></span>
                    <span className="v2-support-pill">{item.badgeText}</span>
                  </div>
                  <div className="v2-reward-content">
                    <span className="v2-support-eyebrow">{item.category === "tech" ? "Công nghệ" : item.category === "limited" ? "Giới hạn" : "Góc học tập"}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="v2-reward-meta">
                      <strong>{item.cost.toLocaleString(appConfig.locale)} GP</strong>
                      <small>Kho mẫu: {stock} {item.unit}</small>
                    </div>
                    {!eligible && stock > 0 && (
                      <div className="v2-reward-progress">
                        <div><span>Điểm tích lũy</span><span>Thiếu {shortfall} GP</span></div>
                        <Progress
                          value={rewardProgress(gpBalance, item.cost)}
                          max={100}
                          label={`Tiến độ tích GP cho ${item.name}`}
                        />
                      </div>
                    )}
                    <Button
                      className="v2-reward-card-action"
                      disabled={!stock}
                      onClick={() => eligible ? setSelected(item) : onNavigate("/tu-giai")}
                    >
                      <Icon name={eligible ? "redeem" : stock ? "school" : "lock"} />
                      {!stock ? "Hết quà mẫu" : eligible ? "Thử đổi quà" : "Tự giải để tích GP"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="v2-support-empty">
            <Icon name="redeem" />
            <h3>Chưa có quà phù hợp</h3>
            <p>Đổi bộ lọc hoặc tự giải thêm để tích lũy GP.</p>
            <Button onClick={() => setFilter("all")}>Xem tất cả quà</Button>
          </div>
        )}
      </section>

      <section className="v2-support-panel v2-rewards-history" aria-labelledby="v2-rewards-history-title">
        <div className="v2-support-panel-heading">
          <div>
            <p className="v2-support-eyebrow">Yêu cầu lưu trên trình duyệt</p>
            <h2 id="v2-rewards-history-title">Lịch sử đổi quà mẫu</h2>
          </div>
          <span className="v2-support-pill">{requests.length} yêu cầu</span>
        </div>
        {requests.length ? (
          <ol>
            {requests.map((request) => (
              <li key={request.id}>
                <span className="v2-reward-history-icon"><Icon name="redeem" /></span>
                <div>
                  <strong>{request.itemName}</strong>
                  <small>{new Intl.DateTimeFormat(appConfig.locale, {
                    dateStyle: "medium", timeStyle: "short", timeZone: appConfig.timeZone,
                  }).format(new Date(request.createdAt))}</small>
                </div>
                <span>−{request.cost} GP</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="v2-support-muted">Chưa có yêu cầu đổi quà mẫu nào được lưu.</p>
        )}
      </section>

      <Modal
        open={showFlow}
        onClose={() => setShowFlow(false)}
        title="Quy trình đổi quà minh họa"
        description="Hiện chưa có xử lý đơn hàng hoặc gửi thông báo thật."
        footer={<Button onClick={() => setShowFlow(false)}>Đã hiểu</Button>}
      >
        <ol className="v2-rewards-flow">
          {rewardFlow.map((step, index) => (
            <li key={step.title}>
              <span>{index + 1}</span>
              <div><strong>{step.title}</strong><p>{step.description}</p></div>
            </li>
          ))}
        </ol>
      </Modal>
      {selected && (
        <RedemptionDialog
          key={selected.id}
          item={selected}
          balance={gpBalance}
          stock={availableStock(selected, requests)}
          onClose={() => setSelected(null)}
          onConfirm={confirmRedemption}
        />
      )}
    </div>
  );
}
