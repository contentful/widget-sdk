import React from 'react';
import PropTypes from 'prop-types';
import ExtensionEditor from '../ExtensionEditor';
import { ExtensionEditorSkeleton } from '../skeletons/ExtensionEditorSkeleton';
import createFetcherComponent from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';

const ExtensionFetcher = createFetcherComponent(({ cma, extensionId }) => {
  return cma.getExtension(extensionId);
});

export class ExtensionEditorRoute extends React.Component {
  static propTypes = {
    extensionId: PropTypes.string.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    goToList: PropTypes.func.isRequired,
    cma: PropTypes.shape({
      getExtension: PropTypes.func.isRequired
    }).isRequired
  };

  render() {
    if (!getSectionVisibility()['extensions']) {
      return <ForbiddenPage />;
    }

    return (
      <ExtensionFetcher cma={this.props.cma} extensionId={this.props.extensionId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <ExtensionEditorSkeleton goToList={this.props.goToList} />;
          }
          if (isError) {
            return <StateRedirect path="^.list" />;
          }
          return (
            <React.Fragment>
              <DocumentTitle title={[data.extension.name, 'Extensions']} />
              <ExtensionEditor
                entity={data}
                registerSaveAction={this.props.registerSaveAction}
                setDirty={this.props.setDirty}
                goToList={this.props.goToList}
                cma={this.props.cma}
              />
            </React.Fragment>
          );
        }}
      </ExtensionFetcher>
    );
  }
}

export default ExtensionEditorRoute;
