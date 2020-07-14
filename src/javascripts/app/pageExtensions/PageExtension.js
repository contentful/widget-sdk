import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { ExtensionIFrameRendererWithLocalHostWarning } from 'widgets/ExtensionIFrameRenderer';
import DocumentTitle from 'components/shared/DocumentTitle';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { LOCATION_PAGE } from 'widgets/WidgetLocations';

const styles = {
  root: css({
    height: '100%',
    width: '100%',
  }),
};

export default class PageExtension extends React.Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    widget: PropTypes.object.isRequired,
    bridge: PropTypes.object.isRequired,
  };

  componentDidMount() {
    trackExtensionRender(LOCATION_PAGE, this.props.widget);
  }

  render() {
    const { path, widget, bridge } = this.props;

    const parameters = {
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

    return (
      <div data-test-id="page-extension" className={styles.root}>
        <DocumentTitle title={widget.name} />
        <ExtensionIFrameRendererWithLocalHostWarning
          bridge={bridge}
          widget={widget}
          parameters={parameters}
          isFullSize
        />
      </div>
    );
  }
}
