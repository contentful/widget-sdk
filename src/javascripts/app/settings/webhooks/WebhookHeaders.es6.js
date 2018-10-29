import React from 'react';
import PropTypes from 'prop-types';
import WebhookSecretHeaderDialog from './dialogs/WebhookSecretHeaderDialog.es6';
import WebhookHttpBasicDialog from './dialogs/WebhookHttpBasicDialog.es6';

export class WebhookHeaders extends React.Component {
  static propTypes = {
    headers: PropTypes.array,
    onChange: PropTypes.func.isRequired
  };

  state = {
    isSecretHeaderModalShown: false,
    isHTTPBasicModalShown: false
  };

  componentDidUpdate() {
    if (this.shouldFocus && this.el) {
      const inputs = this.el.querySelectorAll('input');
      inputs[inputs.length - 2].focus(); // focus the key input of the last header
    }
    this.shouldFocus = false;
  }

  getHeaders() {
    return Array.isArray(this.props.headers) ? this.props.headers : [];
  }

  update(i, change) {
    const headers = this.getHeaders();
    const updated = headers.map((h, cur) => (cur === i ? { ...h, ...change } : h));
    this.props.onChange(updated);
  }

  add(header) {
    const headers = this.getHeaders();
    this.props.onChange(headers.concat([header || {}]));
  }

  remove(i) {
    const headers = this.getHeaders();
    this.props.onChange(headers.filter((_, cur) => cur !== i));
  }

  render() {
    const headers = this.getHeaders();

    return (
      <div
        className="cfnext-form__field"
        ref={el => {
          this.el = el;
        }}>
        {headers.map((h, i) => {
          return (
            <div className="webhook-editor__settings-row" key={`${i}`}>
              <input
                type="text"
                className="cfnext-form__input"
                placeholder="Key"
                value={h.key || ''}
                disabled={h.secret}
                onChange={e => this.update(i, { key: e.target.value })}
              />
              {!h.secret && (
                <input
                  type="text"
                  className="cfnext-form__input"
                  placeholder="Value"
                  value={h.value || ''}
                  onChange={e => this.update(i, { value: e.target.value })}
                />
              )}
              {h.secret && (
                <input
                  type="password"
                  className="cfnext-form__input"
                  placeholder="Value of this header is secret"
                  readOnly={true}
                />
              )}
              <button className="btn-link" onClick={() => this.remove(i)}>
                Remove
              </button>
            </div>
          );
        })}

        <button
          className="btn-link webhook-header-action"
          onClick={() => {
            this.shouldFocus = true; // mark to be focused when the component updates next time
            this.add();
          }}>
          + Add custom header
        </button>

        <button
          className="btn-link webhook-header-action"
          onClick={() => this.setState({ isSecretHeaderModalShown: true })}>
          + Add secret header
        </button>

        <button
          className="btn-link webhook-header-action"
          onClick={() => this.setState({ isHTTPBasicModalShown: true })}>
          + Add HTTP Basic Auth header
        </button>

        <WebhookHttpBasicDialog
          isShown={this.state.isHTTPBasicModalShown}
          onCancel={() => {
            this.setState({ isHTTPBasicModalShown: false });
          }}
          onConfirm={({ key, value }) => {
            this.setState({ isHTTPBasicModalShown: false });
            this.add({ key, value, secret: true });
          }}
        />

        <WebhookSecretHeaderDialog
          isShown={this.state.isSecretHeaderModalShown}
          onCancel={() => {
            this.setState({ isSecretHeaderModalShown: false });
          }}
          onConfirm={({ key, value }) => {
            this.setState({ isSecretHeaderModalShown: false });
            this.add({ key, value, secret: true });
          }}
        />
      </div>
    );
  }
}

export default WebhookHeaders;
