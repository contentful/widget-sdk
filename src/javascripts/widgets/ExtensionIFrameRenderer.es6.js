import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import * as Config from 'Config.es6';

import ExtensionDevelopmentMode from './ExtensionDevelopmentMode.es6';
import Channel from './ExtensionIFrameChannel.es6';
import ExtensionAPI from './ExtensionAPI.es6';

const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms';

function isAppDomain(src) {
  const protocol = ['//', 'http://', 'https://'].find(p => src.startsWith(p));

  if (protocol) {
    const [domain] = src.slice(protocol.length).split('/');
    const appDomain = `app.${Config.domain}`;
    return domain === appDomain || domain.endsWith(`.${appDomain}`);
  } else {
    return false;
  }
}

export default class ExtensionIFrameRenderer extends React.Component {
  static propTypes = {
    bridge: PropTypes.shape({
      getData: PropTypes.func.isRequired,
      apply: PropTypes.func.isRequired,
      install: PropTypes.func.isRequired
    }).isRequired,
    descriptor: PropTypes.shape({
      id: PropTypes.string,
      src: PropTypes.string,
      srcdoc: PropTypes.string
    }).isRequired,
    parameters: PropTypes.shape({
      instance: PropTypes.object.isRequired,
      installation: PropTypes.object.isRequired,
      invocation: PropTypes.object
    }).isRequired,
    isFullSize: PropTypes.bool
  };

  // There's no need to update. Once the iframe is loaded
  // it's only `ExtensionAPI` talking with the Extension over
  // `postMessage`. If updating we could incidentally remove
  // the iframe.
  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    if (this.extensionApi) {
      this.extensionApi.destroy();
    }
  }

  render() {
    const src = get(this.props, ['descriptor', 'src'], '');
    const isDevMode = src.startsWith('http://localhost');

    const style = {
      width: '100%',
      height: this.props.isFullSize ? '100%' : 'auto'
    };

    const iframe = <iframe style={style} ref={this.initialize} onLoad={this.onLoad} />;
    if (isDevMode) {
      return <ExtensionDevelopmentMode>{iframe}</ExtensionDevelopmentMode>;
    }
    return iframe;
  }

  // This will be called when the iframe navigates or is refreshed.
  // We want to connect in this case too (otherwise we'd just render
  // HTML page but the `contentfulExtension.init(cb)` callback wouldn't
  // be called).
  onLoad = () => this.extensionApi.connect();

  initialize = iframe => {
    if (!iframe || this.extensionApi) {
      return;
    }

    const { bridge, descriptor } = this.props;
    const { src, srcdoc, id } = descriptor;

    // Cherry-pick only valid parameter types.
    const parameters = {
      // Make sure instance and installation parameters
      // are always defined (default is an empty object).
      instance: this.props.parameters.instance || {},
      installation: this.props.parameters.installation || {}
    };

    // Only add invocation parameters when defined.
    const { invocation } = this.props.parameters;
    if (invocation) {
      parameters.invocation = invocation;
    }

    const channel = new Channel(iframe, window, bridge.apply);
    this.extensionApi = new ExtensionAPI({
      extensionId: id,
      channel,
      parameters,
      ...bridge.getData()
    });
    bridge.install(this.extensionApi);

    iframe.allowfullscreen = true;
    iframe.msallowfullscreen = true;
    iframe.allow = 'fullscreen';

    if (src && !isAppDomain(src)) {
      iframe.sandbox = `${SANDBOX} allow-same-origin`;
      iframe.src = src;
    } else if (srcdoc) {
      iframe.sandbox = SANDBOX;
      iframe.srcdoc = srcdoc;
    }
  };
}
