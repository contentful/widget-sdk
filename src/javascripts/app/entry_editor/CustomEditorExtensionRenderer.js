import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Note } from '@contentful/forma-36-react-components';
import { ExtensionIFrameRendererWithLocalHostWarning } from 'widgets/ExtensionIFrameRenderer';
import { toRendererWidget } from 'widgets/WidgetCompat';
import { WidgetLocation, WidgetRenderer } from '@contentful/widget-renderer';

const styles = {
  installationNote: css({
    margin: tokens.spacingM,
  }),
};

export default class CustomEditorExtensionRenderer extends React.Component {
  static propTypes = {
    extension: PropTypes.shape({
      widgetId: PropTypes.string.isRequired,
      widgetNamespace: PropTypes.string.isRequired,
      problem: PropTypes.string,
      descriptor: PropTypes.object,
      parameters: PropTypes.object,
    }).isRequired,
    createBridge: PropTypes.func.isRequired,
  };

  render() {
    const { createBridge, extension } = this.props;
    const { descriptor, parameters } = extension;

    if (extension.problem) {
      return (
        <Note noteType="warning" className={styles.installationNote}>
          <code>{extension.widgetId}</code> is saved in configuration, but not installed in this
          environment.
        </Note>
      );
    }

    const widget = toRendererWidget(descriptor);
    const { sdk, bridge, useNewWidgetRenderer } = createBridge(
      extension.widgetId,
      extension.widgetNamespace,
      parameters
    );

    console.log(sdk, bridge, useNewWidgetRenderer);

    if (useNewWidgetRenderer) {
      return (
        <WidgetRenderer
          sdk={sdk}
          location={WidgetLocation.ENTRY_EDITOR}
          widget={widget}
          isFullSize
        />
      );
    } else {
      return (
        <ExtensionIFrameRendererWithLocalHostWarning
          bridge={bridge}
          widget={widget}
          parameters={parameters}
          isFullSize
        />
      );
    }
  }
}
