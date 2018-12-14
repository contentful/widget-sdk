import React from 'react';
import PropTypes from 'prop-types';
import { ModalConfirm, TextField } from '@contentful/forma-36-react-components';
import * as Fetcher from './GitHubFetcher.es6';

class GithubInstaller extends React.Component {
  static propTypes = {
    extensionUrl: PropTypes.string,
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  static getInitialState() {
    return { url: null, valid: false, fetching: false, err: null };
  }

  state = GithubInstaller.getInitialState();

  componentDidUpdate(prevProps) {
    if (prevProps.isShown !== this.props.isShown) {
      this.setState(GithubInstaller.getInitialState());
    }
  }

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
      extension => {
        this.setState({ fetching: false });
        return this.props.onConfirm({ extension, url });
      },
      err => this.setState(state => ({ ...state, fetching: false, err }))
    );
  };

  getValidationMessage = () => {
    if (this.state.err) {
      return this.state.err.message;
    }
    const { url, valid } = this.state;
    const hasInput = (url || '').length > 0;
    if (hasInput && !valid) {
      return 'Please provide a valid GitHub URL';
    }
    return '';
  };

  render() {
    const { url, valid, fetching } = this.state;
    const { onCancel, isShown } = this.props;
    const hasInput = (url || '').length > 0;
    const disabled = !hasInput || !valid || fetching;

    return (
      <ModalConfirm
        isShown={isShown}
        title="Install from Github"
        intent="positive"
        confirmLabel="Install"
        onConfirm={() => this.install(url)}
        onCancel={onCancel}
        isConfirmDisabled={disabled}
        isConfirmLoading={fetching}>
        <p>
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
        <TextField
          id="github-repo"
          name="github-repo"
          labelText="GitHub URL"
          type="text"
          value={url || ''}
          onChange={e => this.checkUrl(e.target.value)}
          validationMessage={this.getValidationMessage()}
        />
      </ModalConfirm>
    );
  }
}

export default GithubInstaller;
