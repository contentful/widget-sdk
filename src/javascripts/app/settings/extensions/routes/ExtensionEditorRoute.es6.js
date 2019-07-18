import React from 'react';
import PropTypes from 'prop-types';
import ExtensionEditor, { ExtensionEditorShell } from '../ExtensionEditor.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { getSectionVisibility } from 'access_control/AccessChecker/index.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

const ExtensionFetcher = createFetcherComponent(({ cma, extensionId }) => {
  return cma.getExtension(extensionId);
});

export class ExtensionEditorRoute extends React.Component {
  static propTypes = {
    extensionId: PropTypes.string.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    goToList: PropTypes.func.isRequired,
    cma: PropTypes.shape({ getExtension: PropTypes.func.isRequired }).isRequired
  };

  render() {
    if (!getSectionVisibility()['extensions']) {
      return <ForbiddenPage />;
    }

    return (
      <ExtensionFetcher cma={this.props.cma} extensionId={this.props.extensionId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <ExtensionEditorShell />;
          }
          if (isError) {
            return <StateRedirect to="^.list" />;
          }
          return (
            <React.Fragment>
              <DocumentTitle title={[data.extension.name, 'Extensions']} />
              <ExtensionEditor
                entity={data}
                registerSaveAction={this.props.registerSaveAction}
                setDirty={this.props.setDirty}
                goToList={this.props.goToList}
              />
            </React.Fragment>
          );
        }}
      </ExtensionFetcher>
    );
  }
}

export default ExtensionEditorRoute;
