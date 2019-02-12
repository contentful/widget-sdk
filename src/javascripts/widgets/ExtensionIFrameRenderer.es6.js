import React from 'react';
import PropTypes from 'prop-types';

import * as Config from 'Config.es6';

import Channel from './ExtensionIFrameChannel.es6';
import ExtensionAPI from './ExtensionAPI.es6';

const WIDTH = { width: '100%' };
const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';

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
      src: PropTypes.string,
      srcdoc: PropTypes.string
    }).isRequired,
    parameters: PropTypes.shape({
      instance: PropTypes.object.isRequired,
      installation: PropTypes.object.isRequired
    }).isRequired
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
    return <iframe style={WIDTH} ref={this.initialize} onLoad={this.onLoad} />;
  }

  onLoad = () => this.extensionApi.connect();

  initialize = iframe => {
    if (!iframe || this.extensionApi) {
      return;
    }

    const { bridge, descriptor, parameters } = this.props;
    const { src, srcdoc } = descriptor;

    const channel = new Channel(iframe, window, bridge.apply);
    this.extensionApi = new ExtensionAPI({ channel, parameters, ...bridge.getData() });
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
