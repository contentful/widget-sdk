import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import * as Config from 'Config';

import ExtensionDevelopmentMode from './ExtensionDevelopmentMode';
import ExtensionIFrameChannel from './ExtensionIFrameChannel';
import ExtensionAPI from './ExtensionAPI';

const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms';

function isAppDomain(src) {
  const protocol = ['//', 'http://', 'https://'].find((p) => src.startsWith(p));

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
      install: PropTypes.func.isRequired,
      uninstall: PropTypes.func,
    }).isRequired,
    descriptor: PropTypes.shape({
      id: PropTypes.string,
      namespace: PropTypes.string,
      appDefinitionId: PropTypes.string,
      src: PropTypes.string,
      srcdoc: PropTypes.string,
    }).isRequired,
    parameters: PropTypes.shape({
      instance: PropTypes.object.isRequired,
      installation: PropTypes.object.isRequired,
      invocation: PropTypes.object,
    }).isRequired,
    isFullSize: PropTypes.bool,
  };

  // There's no need to update. Once the iframe is loaded
  // it's only `ExtensionAPI` talking with the Extension over
  // `postMessage`. If updating we could incidentally remove
  // the iframe.
  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    if (this.props.bridge.uninstall) {
      this.props.bridge.uninstall();
    }
    if (this.extensionApi) {
      this.extensionApi.destroy();
    }
  }

  render() {
    const src = get(this.props, ['descriptor', 'src'], '');
    const isDevMode = src.startsWith('http://localhost');

    const style = { width: '100%' };
    if (this.props.isFullSize) {
      // Setting `height` inline style overrides `height` element attribute
      // which is used by the Extension IFrame Channel to handle height changes.
      // For this reason we only define the property if in full size mode
      // (impossible to resize the IFrame or use autoresizer in the SDK).
      style.height = '100%';
    }

    return (
      <>
        {isDevMode && <ExtensionDevelopmentMode />}
        <iframe style={style} ref={this.initialize} onLoad={this.onLoad} />
      </>
    );
  }

  // This will be called when the iframe navigates or is refreshed.
  // We want to connect in this case too (otherwise we'd just render
  // HTML page but the `contentfulExtension.init(cb)` callback wouldn't
  // be called).
  onLoad = () => this.extensionApi.connect();

  initialize = (iframe) => {
    if (!iframe || this.extensionApi) {
      return;
    }

    const { bridge, descriptor } = this.props;
    const { src, srcdoc, id, appDefinitionId } = descriptor;

    // Cherry-pick only valid parameter types.
    const parameters = {
      // Make sure instance and installation parameters
      // are always defined (default is an empty object).
      instance: this.props.parameters.instance || {},
      installation: this.props.parameters.installation || {},
    };

    // Only add invocation parameters when defined.
    const { invocation } = this.props.parameters;
    if (invocation) {
      parameters.invocation = invocation;
    }

    const channel = new ExtensionIFrameChannel(iframe, window, bridge.apply);
    const bridgeData = bridge.getData();

    this.extensionApi = new ExtensionAPI({
      descriptor,
      channel,
      parameters,
      ...bridgeData,
    });

    bridge.install(this.extensionApi);

    iframe.allowfullscreen = true;
    iframe.msallowfullscreen = true;
    iframe.allow = 'fullscreen';
    iframe.style.display = 'block';

    iframe.dataset.extensionId = id;
    iframe.dataset.location = bridgeData.location;

    if (appDefinitionId) {
      iframe.dataset.appDefinitionId = appDefinitionId;
    }

    if (src && !isAppDomain(src)) {
      iframe.sandbox = `${SANDBOX} allow-same-origin`;
      iframe.src = src;
    } else if (srcdoc) {
      iframe.sandbox = SANDBOX;
      iframe.srcdoc = srcdoc;
    }
  };
}
