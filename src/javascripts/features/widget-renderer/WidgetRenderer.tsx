import React from 'react';
import { KnownSDK } from 'contentful-ui-extensions-sdk';

import {
  Widget,
  ExtensionParameterValues,
  AppParameterValues,
  WidgetLocation,
  WidgetNamespace,
  HostingType,
} from './interfaces';

import { PostMessageChannel } from './PostMessageChannel';
import { ChannelMethod } from './channelTypes'
import { setupHandlers } from './handlers';
import { makeConnectMessage } from './makeConnectMessage';
import { setupEventForwarders } from './setupEventForwarders';

const DISALLOWED_DOMAINS = ['app.contentful.com', 'creator.contentful.com'];

const SANDBOX = [
  'allow-scripts',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-forms',
  'allow-downloads',
].join(' ');

interface WidgetRendererProps {
  location: WidgetLocation;
  widget: Widget;
  parameters: {
    values: {
      instance?: ExtensionParameterValues;
      invocation?: AppParameterValues;
    };
  };
  apis: KnownSDK;
  disallowedDomains?: string[];
  isFullSize?: boolean;
}

export class WidgetRenderer extends React.Component<WidgetRendererProps, unknown> {
  static defaultProps = {
    disallowedDomains: DISALLOWED_DOMAINS,
  };

  private channel?: PostMessageChannel;
  private cleanup = () => {}
  private parameters: Record<string, AppParameterValues> = {};
  
  // There's no need to update. Once the iframe is loaded
  // it's only communicating with the renderer over `postMessage`.
  // We could incidentally remove or refresh the iframe if we update
  // the component.
  public shouldComponentUpdate() {
    return false;
  }

  public componentWillUnmount() {
    this.channel?.destroy();
    this.cleanup();
  }

  public render() {
    const style: Record<string, string> = { width: '100%' };
    if (this.props.isFullSize) {
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
  private onLoad = () => {
    this.channel?.connect(
      makeConnectMessage(this.props.apis, this.props.location, this.props.widget, this.parameters)
    );
  };

  private initialize = (iframe: HTMLIFrameElement) => {
    if (!iframe || this.channel) {
      return;
    }

    const { widget } = this.props;
    const { namespace, id, hosting } = widget;

    // Compute all parameters.
    this.parameters.installation = widget.parameters.values.installation;

    // Default instance parameters to an empty object (backwards compat).
    this.parameters.instance = this.props.parameters.values.instance || {};

    // Only add invocation parameters when defined.
    const { invocation } = this.props.parameters.values;
    if (invocation) {
      this.parameters.invocation = invocation;
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

    // Create a communication channel.
    this.channel = new PostMessageChannel(iframe, window);

    // Handle changes to the <iframe> element.
    this.channel.registerHandler(ChannelMethod.SetHeight, (height) => {
      if (!this.props.isFullSize) {
        iframe.setAttribute('height', height);
      }
    });

    // Register all the other handlers.
    setupHandlers(this.channel, this.props.apis, this.props.location);

    // Listen to changes in the host and forward events to the channel.
    this.cleanup = setupEventForwarders(this.channel, this.props.apis, this.props.location);

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
