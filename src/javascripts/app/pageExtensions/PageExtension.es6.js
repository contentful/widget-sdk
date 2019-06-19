import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils.es6';
import trackExtensionRender from 'widgets/TrackExtensionRender.es6';
import { LOCATION_PAGE } from 'widgets/WidgetLocations.es6';

export default class PageExtension extends React.Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    extension: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired,
      extension: PropTypes.shape({
        name: PropTypes.string.isRequired
      }).isRequired,
      parameters: PropTypes.object
    }).isRequired,
    bridge: PropTypes.object.isRequired
  };

  componentDidMount() {
    trackExtensionRender(LOCATION_PAGE, this.props.extension, this.prepareParameters());
  }

  prepareParameters() {
    const { extension, path } = this.props;
    const definitions = get(extension, ['extension', 'parameters', 'installation'], []);
    const values = extension.parameters || {};

    return {
      instance: {},
      installation: applyDefaultValues(definitions, values),
      invocation: { path }
    };
  }

  render() {
    const { extension, bridge } = this.props;

    return (
      <>
        <DocumentTitle title={extension.extension.name} />
        <ExtensionIFrameRenderer
          bridge={bridge}
          descriptor={{ ...extension.extension, id: extension.sys.id }}
          parameters={this.prepareParameters()}
          isFullSize
        />
      </>
    );
  }
}
