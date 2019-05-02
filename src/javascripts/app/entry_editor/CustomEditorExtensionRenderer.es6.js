import React from 'react';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';

export default class CustomEditorExtensionRenderer extends React.Component {
  static propTypes = {
    extension: PropTypes.shape({
      widgetId: PropTypes.string.isRequired,
      widgetNamespace: PropTypes.string.isRequired,
      problem: PropTypes.string,
      descriptor: PropTypes.object,
      parameters: PropTypes.object
    }).isRequired,
    bridge: PropTypes.object.isRequired
  };

  render() {
    const { bridge, extension } = this.props;
    const { descriptor, parameters } = extension;

    if (extension.problem) {
      return (
        <Note noteType="warning" className="f36-margin--m">
          <code>{extension.widgetId}</code> is saved in configuration, but not installed in this
          environment.
        </Note>
      );
    }

    return (
      <ExtensionIFrameRenderer
        bridge={bridge}
        descriptor={descriptor}
        parameters={parameters}
        isFullSize
      />
    );
  }
}
