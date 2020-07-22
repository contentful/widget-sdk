import React from 'react';

import {
  Widget,
  ExtensionParameterValues,
  AppParameterValues,
  WidgetLocation,
  WidgetNamespace,
  HostingType,
} from './interfaces';
import { PostMessageChannel } from './PostMessageChannel';
import { makeCallSpaceMethodHandler, makeNotifyHandler, DialogsAPI, makeOpenDialogHandler, makeNavigateToBulkEditorHandler } from './handlers';

const DISALLOWED_DOMAINS = ['app.contentful.com', 'creator.contentful.com'];

const SANDBOX = [
  'allow-scripts',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-forms',
  'allow-downloads',
].join(' ');

export interface WidgetRendererProps {
  location: WidgetLocation;
  widget: Widget;
  parameters: {
    values: {
      instance?: ExtensionParameterValues;
      invocation?: AppParameterValues;
    };
  };
  apis: {
    locales: any;
    user: any;
    space: {
      getCachedContentTypes: () => any[];
    };
    ids: any;
    contentType?: {
      sys: {
        type: 'ContentType';
        id: string;
      };
      fields: any[];
    };
    editorInterface?: {
      sys: {
        type: 'EditorInteface';
        contentType: {
          sys: {
            id: string;
            type: 'Link';
            linkType: 'ContentType';
          };
        };
      };
    };
    entry?: {
      getSys: () => { id: string };
      fields: Record<
        string,
        {
          getValue: () => any;
        }
      >;
      metadata?: Record<string, any>;
    };
    field?: {
      id: string;
      locale: string;
      type: string;
      required: boolean;
      validations: any[];
      items: any;
      getValue: () => any;
    };
    dialogs?: DialogsAPI;
    navigator?: any;
  };
  disallowedDomains?: string[];
  isFullSize?: boolean;
}

export enum ChannelMethod {
  CallSpaceMethod = 'callSpaceMethod',
  SetHeight = 'setHeight',
  Notify = 'notify',
  NavigateToBulkEditor = 'navigateToBulkEditor',
  OpenDialog = 'openDialog'
}

export class WidgetRenderer extends React.Component<WidgetRendererProps, unknown> {
  static defaultProps = {
    disallowedDomains: DISALLOWED_DOMAINS,
  };

  private channel?: PostMessageChannel;
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
    // Internal format for "connect" message
    const connectMessage = {
      location: this.props.location,
      parameters: this.parameters,
      locales: this.props.apis.locales,
      user: this.props.apis.user,
      contentType: this.props.apis.contentType || { sys: {}, fields: [] },
      initialContentTypes: this.props.apis.space.getCachedContentTypes(),
      editorInterface: this.props.apis.editorInterface,
      ids: {
        ...this.props.apis.ids,
        // Results in `{ app: 'some-app-id' }` or `{ extension: 'some-ext-id' }`.
        [this.props.widget.namespace]: this.props.widget.id,
      },
      entry: this.props.apis.entry
        ? {
            sys: this.props.apis.entry.getSys(),
            metadata: this.props.apis.entry.metadata,
          }
        : { sys: {} },
      fieldInfo:
        this.props.apis.contentType?.fields.map((field) => {
          return {
            localized: field.localized,
            locales: field.localized
              ? this.props.apis.locales.available
              : [this.props.apis.locales.default],
            values: this.props.apis.entry?.fields[field.id].getValue() ?? {},
            id: field.apiName || field.id,
            required: !!field.required,
            type: field.type,
            validations: field.validations,
            items: field.items,
          };
        }) ?? [],
      field: this.props.apis.field
        ? {
            locale: this.props.apis.field.locale,
            value: this.props.apis.field.getValue(),
            id: this.props.apis.field.id,
            type: this.props.apis.field.type,
            required: this.props.apis.field.required,
            validations: this.props.apis.field.validations,
            items: this.props.apis.field.items,
          }
        : undefined,
    };

    this.channel?.connect(connectMessage);
  };

  private initialize = (iframe: HTMLIFrameElement) => {
    if (!iframe) {
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

    this.channel.registerHandler(ChannelMethod.SetHeight, (height) => {
      if (!this.props.isFullSize) {
        iframe.setAttribute('height', height);
      }
    });

    this.channel.registerHandler(
      ChannelMethod.CallSpaceMethod,
      makeCallSpaceMethodHandler(this.props.apis.space)
    );

    this.channel.registerHandler(ChannelMethod.Notify, makeNotifyHandler());

    this.channel.registerHandler(
      ChannelMethod.OpenDialog,
      makeOpenDialogHandler(this.props.apis.dialogs)
    );

    this.channel.registerHandler(
      ChannelMethod.NavigateToBulkEditor,
      makeNavigateToBulkEditorHandler(this.props.apis.navigator)
    )

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
