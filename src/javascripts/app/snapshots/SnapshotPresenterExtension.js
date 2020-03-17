import React from 'react';
import PropTypes from 'prop-types';

import createSnapshotExtensionBridge from 'widgets/bridges/createSnapshotExtensionBridge';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer';

const SnapshotPresenterExtension = ({ descriptor, parameters, ...bridgeProps }) => {
  return (
    <div data-test-id="snapshot-presenter-extension">
      <ExtensionIFrameRenderer
        bridge={createSnapshotExtensionBridge(bridgeProps)}
        descriptor={descriptor}
        parameters={parameters}
      />
    </div>
  );
};

SnapshotPresenterExtension.propTypes = {
  settings: PropTypes.shape({
    trueLabel: PropTypes.string,
    falseLabel: PropTypes.string
  }),
  locale: PropTypes.shape({
    code: PropTypes.string,
    internal_code: PropTypes.string
  }),
  field: PropTypes.oneOfType([
    PropTypes.shape({
      type: PropTypes.string,
      linkType: PropTypes.string
    }),
    PropTypes.shape({
      type: PropTypes.string,
      items: PropTypes.shape({
        type: PropTypes.string,
        linkType: PropTypes.string
      })
    })
  ]),
  descriptor: PropTypes.shape({
    id: PropTypes.string,
    appDefinitionId: PropTypes.string,
    src: PropTypes.string,
    srcdoc: PropTypes.string
  }),
  parameters: PropTypes.shape({
    instance: PropTypes.object.isRequired,
    installation: PropTypes.object.isRequired,
    invocation: PropTypes.object
  }),
  entity: PropTypes.object,
  editorData: PropTypes.shape({
    editorInterface: PropTypes.object,
    contentType: PropTypes.object
  })
};

export default SnapshotPresenterExtension;
