import React, { useEffect, useMemo } from 'react';
import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import {
  Widget,
  WidgetLocation,
  WidgetRenderer as NewWidgetRenderer,
} from '@contentful/widget-renderer';
import { css } from 'emotion';
import { ExtensionIFrameRendererWithLocalHostWarning } from 'widgets/ExtensionIFrameRenderer';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils';
import DocumentTitle from 'components/shared/DocumentTitle';

export interface PageWidgetParameters {
  instance: Record<string, any>;
  invocation: { path: string };
  installation: Record<string, any>;
}

interface PageWidgetRendererProps {
  useNewWidgetRendererInPageLocation: boolean;
  createPageExtensionSDK: (widget: Widget, parameters: PageWidgetParameters) => PageExtensionSDK;
  widget: Widget;
  createPageExtensionBridge: (widget: Widget) => any;
  environmentId: string;
  path: string;
}

const styles = {
  root: css({
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    overflowX: 'hidden',
  }),
};

export const PageWidgetRenderer = (props: PageWidgetRendererProps) => {
  useEffect(() => {
    trackExtensionRender(WidgetLocation.PAGE, toLegacyWidget(props.widget), props.environmentId);
  }, []);

  const parameters = useMemo(() => {
    return {
      // No instance parameters for Page Extensions.
      instance: {},
      // Regular installation parameters.
      installation: applyDefaultValues(
        props.widget.parameters.definitions.installation,
        props.widget.parameters.values.installation
      ),
      // Current `path` is the only invocation parameter.
      invocation: { path: props.path },
    };
  }, [props.widget, props.path]);

  const sdk = useMemo(() => {
    return props.createPageExtensionSDK(props.widget, parameters);
  }, [props.widget, parameters]);

  const bridge = useMemo(() => {
    return props.createPageExtensionBridge(props.widget);
  }, [props.widget]);

  return (
    <div data-test-id="page-extension" className={styles.root}>
      <DocumentTitle title={props.widget.name} />
      {props.useNewWidgetRendererInPageLocation ? (
        <NewWidgetRenderer
          isFullSize
          location={WidgetLocation.PAGE}
          sdk={sdk}
          widget={props.widget}
        />
      ) : (
        <ExtensionIFrameRendererWithLocalHostWarning
          bridge={bridge}
          parameters={parameters}
          widget={props.widget}
          isFullSize
        />
      )}
    </div>
  );
};
