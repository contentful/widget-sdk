import React from 'react';
import PropTypes from 'prop-types';

import Channel from './ExtensionIFrameChannel.es6';
import ExtensionAPI from './ExtensionAPI.es6';

const WIDTH = { width: '100%' };
const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';

function isAppDomain(src, appDomain) {
  const protocol = ['//', 'http://', 'https://'].find(p => src.startsWith(p));

  if (protocol) {
    const [domain] = src.slice(protocol.length).split('/');
    return domain === appDomain || domain.endsWith(`.${appDomain}`);
  } else {
    return false;
  }
}

export default class WidgetRenderWarning extends React.Component {
  static propTypes = {
    bridge: PropTypes.shape({
      getData: PropTypes.func.isRequired,
      apply: PropTypes.func.isRequired,
      install: PropTypes.func.isRequired
    }).isRequired,
    src: PropTypes.string,
    srcdoc: PropTypes.string,
    appDomain: PropTypes.string.isRequired
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

    const { bridge, src, srcdoc, appDomain } = this.props;
    const channel = new Channel(iframe, window, bridge.apply);
    this.extensionApi = new ExtensionAPI({ channel, ...bridge.getData() });
    bridge.install(this.extensionApi);

    iframe.allowfullscreen = true;
    iframe.msallowfullscreen = true;
    iframe.allow = 'fullscreen';

    if (src && !isAppDomain(src, appDomain)) {
      iframe.sandbox = `${SANDBOX} allow-same-origin`;
      iframe.src = src;
    } else if (srcdoc) {
      iframe.sandbox = SANDBOX;
      iframe.srcdoc = srcdoc;
    }
  };
}
