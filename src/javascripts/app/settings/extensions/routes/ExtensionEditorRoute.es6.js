import React from 'react';
import PropTypes from 'prop-types';
import AdminOnly from 'app/common/AdminOnly.es6';
import ExtensionEditor, { ExtensionEditorShell } from '../ExtensionEditor.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';

const ExtensionFetcher = createFetcherComponent(({ cma, extensionId }) => {
  return cma.getExtension(extensionId);
});

export class ExtensionEditorRoute extends React.Component {
  static propTypes = {
    extensionId: PropTypes.string.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    cma: PropTypes.shape({ getExtension: PropTypes.func.isRequired }).isRequired
  };

  render() {
    return (
      <AdminOnly>
        <ExtensionFetcher cma={this.props.cma} extensionId={this.props.extensionId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <ExtensionEditorShell />;
            }
            if (isError) {
              return <StateRedirect to="^.list" />;
            }
            return (
              <ExtensionEditor
                entity={data}
                registerSaveAction={this.props.registerSaveAction}
                setDirty={this.props.setDirty}
              />
            );
          }}
        </ExtensionFetcher>
      </AdminOnly>
    );
  }
}

export default ExtensionEditorRoute;
