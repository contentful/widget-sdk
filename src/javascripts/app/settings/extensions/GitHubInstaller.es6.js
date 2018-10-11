import React from 'react';
import PropTypes from 'prop-types';
import * as Fetcher from './GitHubFetcher.es6';

class Installer extends React.Component {
  static propTypes = {
    extensionUrl: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  state = { url: null, valid: false, fetching: false, err: null };

  componentDidMount() {
    if (this.props.extensionUrl) {
      this.checkUrl(this.props.extensionUrl);
    }
  }

  checkUrl = url => {
    this.setState(() => ({ url, valid: Fetcher.isValidSource(url), err: null }));
  };

  install = url => {
    this.setState(state => ({ ...state, fetching: true }));
    Fetcher.fetchExtension(url).then(
      extension => this.props.onConfirm({ extension, url }),
      err => this.setState(state => ({ ...state, fetching: false, err }))
    );
  };

  render() {
    const { url, valid, fetching, err } = this.state;
    const { onCancel } = this.props;
    const hasInput = (url || '').length > 0;
    const disabled = !hasInput || !valid || fetching;

    return (
      <div className="modal-dialog">
        <header className="modal-dialog__header">
          <h1>Install from GitHub</h1>
          <button className="modal-dialog__close" onClick={onCancel} />
        </header>
        <div className="modal-dialog__content">
          <p className="modal-dialog__richtext">
            Paste a public GitHub link to an <code>extension.json</code> descriptor file.{' '}
            <strong>Important:</strong> use only sources that you trust. You can check the{' '}
            <a
              href="https://github.com/contentful/extensions/tree/master/samples"
              target="_blank"
              rel="noopener noreferrer">
              <code>contentful/extensions</code>
            </a>{' '}
            repository.
          </p>
          <input
            className="cfnext-form__input--full-size"
            type="text"
            value={url || ''}
            onChange={e => this.checkUrl(e.target.value)}
          />
          {!err &&
            hasInput &&
            !valid && <p className="cfnext-form__field-error">Please provide a valid GitHub URL</p>}
          {err && <p className="cfnext-form__field-error">{err.message}</p>}
        </div>
        <div className="modal-dialog__controls">
          <button
            className="btn-primary-action"
            disabled={disabled}
            onClick={() => this.install(url)}>
            Install
          </button>
          <button className="btn-secondary-action" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
}

export default Installer;
