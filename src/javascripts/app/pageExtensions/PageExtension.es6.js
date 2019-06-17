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
        descriptor={{ id: props.extensionId, ...props.extension }}
        parameters={parameters}
        isFullSize
      />
    </>
  );
}

PageExtension.propTypes = {
  extensionId: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  extension: PropTypes.shape({
    extension: PropTypes.object.isRequired,
    parameters: PropTypes.object
  }).isRequired,
  bridge: PropTypes.object.isRequired
};
