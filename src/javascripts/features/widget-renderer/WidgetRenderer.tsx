import React from 'react';

import {
  Widget,
  ExtensionParameterValues,
  AppParameterValues,
  WidgetLocation,
  WidgetNamespace,
  HostingType,
} from './interfaces';

const DISALLOWED_DOMAINS = ['app.contentful.com', 'creator.contentful.com'];

const SANDBOX = [
  'allow-scripts',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-forms',
  'allow-downloads',
].join(' ');

interface Props {
  location: WidgetLocation;
  widget: Widget;
  parameters: {
    values: {
      instance?: ExtensionParameterValues;
      invocation?: AppParameterValues;
    };
  };
  apis: {};
  disallowedDomains?: string[];
  isFullSize?: boolean;
}

export class WidgetRenderer extends React.Component<Props, unknown> {
  static defaultProps = {
    disallowedDomains: DISALLOWED_DOMAINS,
  };

  // There's no need to update. Once the iframe is loaded
  // it's only communicating with the renderer over `postMessage`.
  // We could incidentally remove or refresh the iframe if we update
  // the component.
  public shouldComponentUpdate() {
    return false;
  }

  public componentWillUnmount() {
    // TODO: cleanup all the things
  }

  public render() {
    const style: Record<string, string> = { width: '100%' };
    if (this.props.isFullSize) {
      // TODO: specific to iframe channel implementation, test when rewritten
      // Setting `height` inline style overrides `height` element attribute
      // which is used by the Extension IFrame Channel to handle height changes.
      // For this reason we only define the property if in full size mode
      // (impossible to resize the IFrame or use autoresizer in the SDK).
      style.height = '100%';
    }

    return (
      <iframe
        style={style}
        ref={this.initialize}
        onLoad={this.onLoad}
        sandbox={this.getSandbox(this.props.widget)}
      />
    );
  }

  // This method is called when:
  // - iframe loads for the first time,
  // - iframe navigates (location.href = ...)
  // - iframe refreshes (location.reload())
  //
  // We want to connect in all these cases. If we would only connnect
  // on the initial page load the consecutive page loads would render
  // the HTML page but the `sdk.init(cb)` callback wouldn't be called).
  private onLoad = (...args) => {
    console.log('onLoad', args);
  };

  private initialize = (iframe: HTMLIFrameElement) => {
    if (!iframe) {
      return;
    }

    const { widget } = this.props;
    const { namespace, id, hosting } = widget;

    // Compute all parameters.
    const parameters: Record<string, AppParameterValues> = {};
    parameters.installation = widget.parameters.values.installation;

    // Default instance parameters to an empty object (backwards compat).
    parameters.instance = this.props.parameters.values.instance || {};

    // Only add invocation parameters when defined.
    const { invocation } = this.props.parameters.values;
    if (invocation) {
      parameters.invocation = invocation;
    }

    // Fullscreen is allowed.
    iframe.allowFullscreen = true;
    iframe.allow = 'fullscreen';
    iframe.style.display = 'block';

    // Used in analytics:
    iframe.dataset.extensionId = id; // Named "extensionId" for backwards compat.
    iframe.dataset.location = this.props.location;
    if (namespace === WidgetNamespace.APP) {
      iframe.dataset.appDefinitionId = id;
    }

    // Render the iframe content
    if (this.isSrc(widget)) {
      iframe.src = hosting.value;
    } else if (this.isSrcdoc(widget)) {
      iframe.srcdoc = hosting.value;
    } else {
      // todo: better messaging
      throw new Error('x');
    }
  };

  private isSrc({ hosting }: Widget) {
    return hosting.type === HostingType.SRC && !this.isDisallowedDomain(hosting.value);
  }

  private isSrcdoc({ hosting }: Widget) {
    return hosting.type === HostingType.SRCDOC;
  }

  private isDisallowedDomain(url: string) {
    const protocol = ['//', 'http://', 'https://'].find((p) => url.startsWith(p));

    if (protocol) {
      const [domain] = url.slice(protocol.length).split('/');

      return (this.props.disallowedDomains as string[]).some((testedDomain) => {
        return domain === testedDomain || domain.endsWith(`.${testedDomain}`);
      });
    } else {
      return false;
    }
  }

  private getSandbox(widget: Widget) {
    return this.isSrc(widget) ? `${SANDBOX} allow-same-origin` : SANDBOX;
  }
}
