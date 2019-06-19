import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils.es6';

export default function PageExtension(props) {
  const parameters = {
    instance: {},
    installation: applyDefaultValues(
      get(props.extension, ['extension', 'parameters', 'installation'], []),
      props.extension.parameters || {}
    ),
    invocation: {
      path: props.path
    }
  };

  return (
    <>
      <DocumentTitle title={props.extension.extension.name} />
      <ExtensionIFrameRenderer
        bridge={props.bridge}
        descriptor={{ ...props.extension.extension, id: props.extension.sys.id }}
        parameters={parameters}
        isFullSize
      />
    </>
  );
}

PageExtension.propTypes = {
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
