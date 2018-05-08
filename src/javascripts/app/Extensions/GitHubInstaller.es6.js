import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {isValidSource, fetchExtension} from './GitHubFetcher';

const Installer = createReactClass({
  propTypes: {
    confirm: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired
  },
  getInitialState () {
    return {url: null, valid: false, err: null};
  },
  checkUrl (url) {
    this.setState(() => ({url, valid: isValidSource(url), err: null}));
  },
  install (url) {
    fetchExtension(url)
    .then(
      extension => this.props.confirm(extension),
      err => this.setState(state => ({...state, err}))
    );
  },
  render () {
    const {url, valid, err} = this.state;
    const {cancel} = this.props;
    const hasInput = (url || '').length > 0;

    return <div className="modal-dialog">
      <header className="modal-dialog__header">
        <h1>Install from GitHub</h1>
        <button className="modal-dialog__close" onClick={cancel} />
      </header>
      <div className="modal-dialog__content">
        <p className="modal-dialog__richtext">
          Paste a public GitHub link to the <code>extension.json</code> descriptor file.
          {' '}<strong>Important:</strong> use only sources that you trust.
          {' '}You can check the <a
            href="https://github.com/contentful/extensions/tree/master/samples"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>contentful/extensions</code>
          </a> repository.
        </p>
        <input
          className="cfnext-form__input--full-size"
          type="text"
          value={url || ''}
          onChange={e => this.checkUrl(e.target.value)}
        />
        {!err && hasInput && !valid && <p className="cfnext-form__field-error">
          Please provide a valid GitHub URL
        </p>}
        {err && <p className="cfnext-form__field-error">{err.message}</p>}
      </div>
      <div className="modal-dialog__controls">
        <button
          className="btn-primary-action"
          disabled={!hasInput || !valid}
          onClick={() => this.install(url)}
        >
          Install
        </button>
        <button className="btn-secondary-action" onClick={cancel}>Cancel</button>
      </div>
    </div>;
  }
});

export default Installer;
