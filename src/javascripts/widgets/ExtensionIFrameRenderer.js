import React from 'react';
import PropTypes from 'prop-types';

import * as Config from 'Config';

import ExtensionLocalDevelopmentWarning from './ExtensionLocalDevelopmentWarning';
import ExtensionIFrameChannel from './ExtensionIFrameChannel';
import ExtensionAPI from './ExtensionAPI';
import { WidgetNamespace, HostingType } from 'features/widget-renderer';

const SANDBOX = [
  'allow-scripts',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-forms',
  'allow-downloads',
].join(' ');

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

const sharedPropTypes = {
  bridge: PropTypes.shape({
    getData: PropTypes.func.isRequired,
    apply: PropTypes.func.isRequired,
    install: PropTypes.func.isRequired,
    uninstall: PropTypes.func,
  }).isRequired,
  widget: PropTypes.shape({
    namespace: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    hosting: PropTypes.shape({
      type: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  parameters: PropTypes.shape({
    instance: PropTypes.object.isRequired,
    installation: PropTypes.object.isRequired,
    invocation: PropTypes.object,
  }).isRequired,
  isFullSize: PropTypes.bool,
};

export default class ExtensionIFrameRenderer extends React.Component {
  static propTypes = sharedPropTypes;

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

    const { bridge, widget } = this.props;
    const { namespace, id, hosting } = widget;

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
      widget,
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
    iframe.dataset.environmentId = this.props.bridge.getData().environmentId;
    iframe.dataset.location = bridgeData.location;

    if (namespace === WidgetNamespace.APP) {
      iframe.dataset.appDefinitionId = id;
    }

    if (hosting.type === HostingType.SRC && !isAppDomain(hosting.value)) {
      iframe.sandbox = `${SANDBOX} allow-same-origin`;
      iframe.src = hosting.value;
    } else if (hosting.type === HostingType.SRCDOC) {
      iframe.sandbox = SANDBOX;
      iframe.srcdoc = hosting.value;
    }
  };
}

export function ExtensionIFrameRendererWithLocalHostWarning(props) {
  const isSrc = props.widget.hosting === HostingType.SRC;
  const isDevMode = isSrc && props.widget.hosting.value.startsWith('http://localhost');
  return (
    <>
      <ExtensionLocalDevelopmentWarning developmentMode={isDevMode}>
        <ExtensionIFrameRenderer {...props} />
      </ExtensionLocalDevelopmentWarning>
    </>
  );
}

ExtensionIFrameRendererWithLocalHostWarning.propTypes = sharedPropTypes;
