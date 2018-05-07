import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import parseGithubUrl from 'parse-github-url';

import {isValidSource, fetchExtension} from './GitHubFetcher';

const Installer = createReactClass({
  propTypes: {
    confirm: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired
  },
  getInitialState () {
    return {url: null, parsed: null, valid: false, err: null};
  },
  parse (url) {
    const parsed = parseGithubUrl(url);
    const valid = isValidSource(parsed);
    this.setState(() => ({url, parsed, valid, err: null}));
  },
  install (parsed) {
    fetchExtension(parsed)
    .then(
      extension => this.props.confirm(extension),
      err => this.setState(state => ({...state, err}))
    );
  },
  render () {
    const {url, parsed, valid, err} = this.state;
    const {cancel} = this.props;

    return <div className="modal-dialog">
      <header className="modal-dialog__header">
        <h1>Install from GitHub</h1>
        <button className="modal-dialog__close" onClick={cancel} />
      </header>
      <div className="modal-dialog__content">
        <p className="modal-dialog__richtext">
          Paste a GitHub link to the <code>extension.json</code> descriptor file.
        </p>
        <input
          className="cfnext-form__input--full-size"
          type="text"
          value={url || ''}
          onChange={e => this.parse(e.target.value)}
        />
        {!err && !valid && <p className="cfnext-form__field-error">Please provide a valid GitHub URL</p>}
        {err && <p className="cfnext-form__field-error">{err.message}</p>}
      </div>
      <div className="modal-dialog__controls">
        <button
          className="btn-primary-action"
          disabled={!valid}
          onClick={() => this.install(parsed)}
        >
          Install
        </button>
        <button className="btn-secondary-action" onClick={cancel}>Cancel</button>
      </div>
    </div>;
  }
});

export default Installer;
