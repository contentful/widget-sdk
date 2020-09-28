import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Note } from '@contentful/forma-36-react-components';
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
    createSdk: PropTypes.func.isRequired,
  };

  render() {
    const { createSdk, extension } = this.props;
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
    const sdk = createSdk(extension.widgetId, extension.widgetNamespace, parameters);

    return (
      <WidgetRenderer sdk={sdk} location={WidgetLocation.ENTRY_EDITOR} widget={widget} isFullSize />
    );
  }
}
