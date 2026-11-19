import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** 화면 일부에서 예기치 못한 오류가 나도 사이트 전체가 하얗게 사라지지 않도록 막습니다. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.error(error);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="lesson" role="alert">
        <h1>화면을 표시하다가 문제가 생겼습니다</h1>
        <p>
          <button className="btn btn--primary" onClick={() => this.setState({ failed: false })}>
            다시 시도
          </button>{' '}
          <button className="btn" onClick={() => window.location.reload()}>
            새로고침
          </button>
        </p>
      </div>
    );
  }
}
