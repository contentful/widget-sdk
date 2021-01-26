import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { WebhookSecretHeaderDialog } from './dialogs/WebhookSecretHeaderDialog';
import { WebhookHttpBasicDialog } from './dialogs/WebhookHttpBasicDialog';

const styles = {
  addHeaderBtn: css({
    display: 'block',
    marginBottom: tokens.spacingS,
  }),
};

export class WebhookHeaders extends React.Component {
  static propTypes = {
    headers: PropTypes.array,
    onChange: PropTypes.func.isRequired,
  };

  state = {
    isSecretHeaderModalShown: false,
    isHTTPBasicModalShown: false,
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
        ref={(el) => {
          this.el = el;
        }}>
        {headers.map((h, i) => {
          return (
            <div data-test-id="setting-row" className="webhook-editor__settings-row" key={`${i}`}>
              <TextInput
                testId={`${i}-key`}
                placeholder="Key"
                value={h.key || ''}
                disabled={h.secret}
                onChange={(e) => this.update(i, { key: e.target.value })}
              />
              {!h.secret && (
                <TextInput
                  testId={`${i}-value`}
                  placeholder="Value"
                  value={h.value || ''}
                  onChange={(e) => this.update(i, { value: e.target.value })}
                />
              )}
              {h.secret && (
                <TextInput
                  testId={`${i}-value`}
                  type="password"
                  placeholder="Value of this header is secret"
                  readOnly={true}
                />
              )}
              <TextLink testId="remove-header" onClick={() => this.remove(i)}>
                Remove
              </TextLink>
            </div>
          );
        })}

        <TextLink
          className={styles.addHeaderBtn}
          testId="add-custom-header"
          onClick={() => {
            this.shouldFocus = true; // mark to be focused when the component updates next time
            this.add();
          }}>
          + Add custom header
        </TextLink>

        <TextLink
          className={styles.addHeaderBtn}
          testId="add-secret-header"
          onClick={() => this.setState({ isSecretHeaderModalShown: true })}>
          + Add secret header
        </TextLink>

        <TextLink
          className={styles.addHeaderBtn}
          testId="add-http-basic-url-header"
          onClick={() => this.setState({ isHTTPBasicModalShown: true })}>
          + Add HTTP Basic Auth header
        </TextLink>

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
