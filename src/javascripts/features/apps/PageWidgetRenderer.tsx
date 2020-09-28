import React, { useEffect, useMemo } from 'react';
import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Widget, WidgetLocation, WidgetRenderer } from '@contentful/widget-renderer';
import { css } from 'emotion';
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
  createPageExtensionSDK: (widget: Widget, parameters: PageWidgetParameters) => PageExtensionSDK;
  widget: Widget;
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
  const { widget, environmentId, path, createPageExtensionSDK } = props;

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

  return (
    <div data-test-id="page-extension" className={styles.root}>
      <DocumentTitle title={widget.name} />
      <WidgetRenderer isFullSize location={WidgetLocation.PAGE} sdk={sdk} widget={widget} />
    </div>
  );
};
