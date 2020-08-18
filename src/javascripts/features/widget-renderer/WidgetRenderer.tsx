import React from 'react';
import { noop } from 'lodash';
import { KnownSDK } from 'contentful-ui-extensions-sdk';

import { Widget, WidgetLocation, WidgetNamespace, HostingType } from './interfaces';
import { PostMessageChannel } from './PostMessageChannel';
import { ChannelMethod } from './channelTypes';
import { setupHandlers } from './handlers';
import { makeConnectMessage } from './makeConnectMessage';
import { setupEventForwarders } from './setupEventForwarders';

const DEFAULT_SANDBOX = [
  'allow-scripts',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-forms',
  'allow-downloads',
].join(' ');

const SRC_SANDBOX = `${DEFAULT_SANDBOX} allow-same-origin`;

interface WidgetRendererProps {
  location: WidgetLocation;
  widget: Widget;
  sdk: KnownSDK;
  isFullSize?: boolean;
}

export class WidgetRenderer extends React.Component<WidgetRendererProps, unknown> {
  private channel?: PostMessageChannel;
  private cleanup = noop;

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
    const { isFullSize, widget } = this.props;
    const heightStyle = isFullSize ? { height: '100%' } : {};
    const style = { display: 'block', width: '100%', ...heightStyle };
    const sandbox = widget.hosting.type === HostingType.SRC ? SRC_SANDBOX : DEFAULT_SANDBOX;

    return (
      <iframe
        style={style}
        sandbox={sandbox}
        allowFullScreen={true}
        allow="fullscreen"
        ref={this.initialize}
        onLoad={this.onLoad}
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
    const { sdk, location } = this.props;
    const connectMessage = makeConnectMessage(sdk, location);

    this.channel?.connect(connectMessage);
  };

  private initialize = (iframe: HTMLIFrameElement) => {
    if (!iframe || this.channel) {
      return;
    }

    const { widget } = this.props;
    const { namespace, id } = widget;

    // TODO: Used in legacy analytics, refactor tracking of custom widgets.
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
        iframe.style.height = `${height}px`;
      }
    });

    // Register all the other handlers.
    setupHandlers(this.channel, this.props.sdk, this.props.location);

    // Listen to changes in the host and forward events to the channel.
    this.cleanup = setupEventForwarders(this.channel, this.props.sdk, this.props.location);

    // Render the iframe content.
    iframe[widget.hosting.type] = widget.hosting.value;
  };
}
