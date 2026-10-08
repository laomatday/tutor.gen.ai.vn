import type { HTMLAttributes } from "react";
import { Alert } from "./Surface";
import { Icon } from "./Icon";
import { cn } from "./utils";

export function DemoDataNotice({
  message = "Đây là dữ liệu minh họa, chưa phải kết quả của bạn.",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { message?: string }) {
  return (
    <Alert
      tone="info"
      className={cn("flex items-center gap-2 text-xs", className)}
      {...props}
    >
      <Icon name="info" className="shrink-0 text-base" />
      <span>{message}</span>
    </Alert>
  );
}
