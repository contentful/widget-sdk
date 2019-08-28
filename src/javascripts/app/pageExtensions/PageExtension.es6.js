import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils.es6';
import trackExtensionRender from 'widgets/TrackExtensionRender.es6';
import { LOCATION_PAGE } from 'widgets/WidgetLocations.es6';

const styles = {
  root: css({
    height: '100%',
    width: '100%'
  })
};

export default class PageExtension extends React.Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    descriptor: PropTypes.object.isRequired,
    bridge: PropTypes.object.isRequired
  };

  componentDidMount() {
    trackExtensionRender(LOCATION_PAGE, this.props.descriptor);
  }

  render() {
    const { path, descriptor, bridge } = this.props;

    const parameters = {
      // No instance parameters for Page Extensions.
      instance: {},
      // Regular installation parameters.
      installation: applyDefaultValues(
        descriptor.installationParameters.definitions,
        descriptor.installationParameters.values
      ),
      // Current `path` is the only invocation parameter.
      invocation: { path }
    };

    return (
      <div data-test-id="page-extension" className={styles.root}>
        <DocumentTitle title={descriptor.name} />
        <ExtensionIFrameRenderer
          bridge={bridge}
          descriptor={descriptor}
          parameters={parameters}
          isFullSize
        />
      </div>
    );
  }
}
