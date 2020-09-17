import React, { useEffect, useMemo } from 'react';
import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Widget, WidgetLocation, WidgetRenderer } from '@contentful/widget-renderer';
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
  const { widget, environmentId, path, createPageExtensionSDK, createPageExtensionBridge } = props;

  useEffect(() => {
    trackExtensionRender(WidgetLocation.PAGE, toLegacyWidget(widget), environmentId);
  }, [widget, environmentId]);

  const parameters = useMemo(() => {
    return {
      // No instance parameters for Page Extensions.
      instance: {},
      // Regular installation parameters.
      installation: applyDefaultValues(
        widget.parameters.definitions.installation,
        widget.parameters.values.installation
      ),
      // Current `path` is the only invocation parameter.
      invocation: { path },
    };
  }, [widget, path]);

  const sdk = useMemo(() => {
    return createPageExtensionSDK(widget, parameters);
  }, [createPageExtensionSDK, widget, parameters]);

  const bridge = useMemo(() => {
    return createPageExtensionBridge(widget);
  }, [createPageExtensionBridge, widget]);

  return (
    <div data-test-id="page-extension" className={styles.root}>
      <DocumentTitle title={widget.name} />
      {props.useNewWidgetRendererInPageLocation ? (
        <WidgetRenderer isFullSize location={WidgetLocation.PAGE} sdk={sdk} widget={widget} />
      ) : (
        <ExtensionIFrameRendererWithLocalHostWarning
          bridge={bridge}
          parameters={parameters}
          widget={widget}
          isFullSize
        />
      )}
    </div>
  );
};
