import React from 'react';
import PropTypes from 'prop-types';
import { ExtensionIFrameRendererWithLocalHostWarning } from 'widgets/ExtensionIFrameRenderer';
import { WidgetNamespace } from 'features/widget-renderer';

export function AppPageLocation({ app, path, bridge }) {
  return (
    <ExtensionIFrameRendererWithLocalHostWarning
      bridge={bridge}
      descriptor={{
        id: app.id,
        namespace: WidgetNamespace.APP,
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
