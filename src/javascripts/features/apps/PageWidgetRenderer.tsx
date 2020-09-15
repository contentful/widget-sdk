import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Widget, WidgetLocation } from '@contentful/widget-renderer';
import { css } from 'emotion';
import { WidgetRenderer as NewWidgetRenderer } from '@contentful/widget-renderer';
import { ExtensionIFrameRendererWithLocalHostWarning } from 'widgets/ExtensionIFrameRenderer';
import React from 'react';

interface PageWidgetRendererProps {
  useNewWidgetLoaderInPageLocation: boolean;
  sdk: PageExtensionSDK;
  widget: Widget;
  bridge: any;
  parameters: {
    instance: Record<string, any>;
    invocation: { path: string };
    installation: Record<string, any>;
  };
}

export const PageWidgetRenderer = (props: PageWidgetRendererProps) => {
  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        overflowX: 'hidden',
      })}>
      {props.useNewWidgetLoaderInPageLocation ? (
        <NewWidgetRenderer location={WidgetLocation.PAGE} sdk={props.sdk} widget={props.widget} />
      ) : (
        <ExtensionIFrameRendererWithLocalHostWarning
          bridge={props.bridge}
          parameters={props.parameters}
          widget={props.widget}
          isFullSize
        />
      )}
    </div>
  );
};
