import React from 'react';
import PropTypes from 'prop-types';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer';

export default function AppPageLocation({ app, path, bridge }) {
  return (
    <ExtensionIFrameRenderer
      bridge={bridge}
      descriptor={{
        id: app.id,
        appDefinitionId: app.appDefinition.sys.id,
        src: app.appDefinition.src,
      }}
      parameters={{
        instance: {},
        invocation: { path },
        installation: app.appInstallation.parameters,
      }}
      isFullSize
    />
  );
}
AppPageLocation.propTypes = {
  app: PropTypes.object.isRequired,
  bridge: PropTypes.object.isRequired,
  path: PropTypes.string.isRequired,
};
