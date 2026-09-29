import { Component } from 'react';

/**
 * Last line of defence: a rendering error shows a recoverable message instead of a blank page.
 * `resetKey` (e.g. the current path) clears the error when the user navigates elsewhere.
 */
export class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="loading" role="alert">
        <span>⚠</span>
        <strong>Something went wrong on this page.</strong>
        <p className="muted">Your data is safe. Reload the page, or go back and try again.</p>
        <div className="action-button-group" style={{ justifyContent: 'center' }}>
          <button className="button" onClick={() => window.location.reload()}>Reload page</button>
          <button className="button secondary" onClick={() => window.history.back()}>Go back</button>
        </div>
      </div>
    );
  }
}
