import { useRef, useState, type FormEvent } from 'react';
import { Alert, Button, Field, Input, Modal } from '../../components/ui';
import type { RewardItem } from './data';
import { canRedeem, validateDelivery, type DeliveryDetails } from './domain';

export function RedemptionDialog({ item, balance, stock, onClose, onConfirm }: {
  item: RewardItem; balance: number; stock: number; onClose: () => void; onConfirm: () => boolean;
}) {
  const [details, setDetails] = useState<DeliveryDetails>({ address: '', parentPhone: '' });
  const [errors, setErrors] = useState<ReturnType<typeof validateDelivery>>({});
  const [walletError, setWalletError] = useState('');
  const submitted = useRef(false);
  const validBalance = canRedeem(balance, item.cost, stock);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (submitted.current) return;
    const nextErrors = validateDelivery(details);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(nextErrors.address ? 'reward-address' : 'reward-parent-phone')?.focus();
      return;
    }
    if (!validBalance) { setWalletError('Số dư hoặc số lượng quà đã thay đổi. Vui lòng kiểm tra lại.'); return; }
    submitted.current = true;
    if (!onConfirm()) { submitted.current = false; setWalletError('Chưa thể đổi quà với số dư hiện tại. Vui lòng thử lại.'); }
  };

  return <Modal open onClose={onClose} title="Xác nhận đổi quà học tập" description="Thao tác thử nghiệm: lưu yêu cầu và trừ GP trên trình duyệt này. Chưa gửi thông báo hay giao quà." footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="reward-redemption" disabled={!validBalance}>Xác nhận đổi {item.cost} GP</Button></>}>
    <form id="reward-redemption" onSubmit={submit} noValidate className="space-y-5">
      <div className="rounded-xl bg-surface-container-low p-4"><h3 className="font-bold text-primary">{item.name}</h3><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt>Chi phí</dt><dd className="font-semibold">{item.cost} GP</dd></div><div className="flex justify-between gap-3"><dt>Số dư sau khi đổi</dt><dd className="font-semibold text-secondary">{Math.max(0, balance - item.cost)} GP</dd></div></dl></div>
      <Field label="Địa chỉ nhận quà" htmlFor="reward-address" error={errors.address} hint="Thông tin biểu mẫu chỉ dùng để thử luồng xác nhận, không được lưu."><Input id="reward-address" autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, tỉnh/thành" value={details.address} maxLength={300} required onChange={event => setDetails(previous => ({ ...previous, address: event.target.value }))} /></Field>
      <Field label="Số điện thoại phụ huynh" htmlFor="reward-parent-phone" error={errors.parentPhone}><Input id="reward-parent-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Nhập số điện thoại" value={details.parentPhone} maxLength={20} required onChange={event => setDetails(previous => ({ ...previous, parentPhone: event.target.value }))} /></Field>
      {(walletError || !validBalance) && <Alert tone="danger">{walletError || 'Không đủ điểm hoặc quà đã hết. Hãy quay lại danh mục.'}</Alert>}
    </form>
  </Modal>;
}
