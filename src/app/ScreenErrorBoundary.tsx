import { Component, type ReactNode } from "react";
import { Alert, Button } from "../components/ui";

export class ScreenErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(
    previous: Readonly<{ children: ReactNode; resetKey: string }>,
  ) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed)
      this.setState({ failed: false });
  }
  render() {
    if (this.state.failed)
      return (
        <Alert tone="danger">
          <p className="font-semibold">Không tải được màn hình này.</p>
          <p className="mt-2">
            Hãy tải lại trang để thử lại. Nội dung đã lưu vẫn được giữ trong
            trình duyệt.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </Button>
        </Alert>
      );
    return this.props.children;
  }
}
