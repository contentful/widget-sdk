import React, { Component } from 'react';
import { getModule } from 'NgRegistry.es6';
import PropTypes from 'prop-types';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import ContentPreviewFormPage, {
  ContentPreviewFormPageSkeleton
} from '../ContentPreviewFormPage.es6';

const spaceContext = getModule('spaceContext');
const contentPreview = getModule('contentPreview');

const ContentTypesFetcher = createFetcherComponent(() => {
  return Promise.all([spaceContext.publishedCTs.refreshBare(), contentPreview.canCreate()]);
});

export default class ContentPreviewNewRoute extends Component {
  static propTypes = {
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <ContentTypesFetcher>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <ContentPreviewFormPageSkeleton />;
            }
            if (isError) {
              return <StateRedirect to="^.list" />;
            }
            const [contentTypes, canCreate] = data;
            if (!canCreate) {
              return <StateRedirect to="^.list" />;
            }

            const initialValue = contentPreview.toInternal(
              {
                name: '',
                description: '',
                sys: {
                  version: 0
                }
              },
              contentTypes
            );

            return (
              <ContentPreviewFormPage
                isNew
                initialValue={initialValue}
                registerSaveAction={this.props.registerSaveAction}
                setDirty={this.props.setDirty}
              />
            );
          }}
        </ContentTypesFetcher>
      </AdminOnly>
    );
  }
}
