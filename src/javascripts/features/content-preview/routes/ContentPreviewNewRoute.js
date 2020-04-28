import React, { Component } from 'react';
import { getModule } from 'core/NgRegistry';
import PropTypes from 'prop-types';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { AdminOnly } from './AdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import DocumentTitle from 'components/shared/DocumentTitle';

import { ContentPreviewFormPage } from '../ContentPreviewFormPage';
import { ContentPreviewFormSkeleton } from '../skeletons/ContentPreviewFormSkeleton';
import { contentPreviewToInternal } from '../services/contentPreviewToInternal';

const ContentTypesFetcher = createFetcherComponent(() => {
  const spaceContext = getModule('spaceContext');

  return spaceContext.publishedCTs.refreshBare();
});

export class ContentPreviewNewRoute extends Component {
  static propTypes = {
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
  };

  render() {
    return (
      <AdminOnly>
        <ContentTypesFetcher>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <ContentPreviewFormSkeleton />;
            }
            if (isError) {
              return <StateRedirect path="^.list" />;
            }

            const initialValue = contentPreviewToInternal(
              {
                name: '',
                description: '',
                sys: {
                  version: 0,
                },
              },
              data
            );

            return (
              <React.Fragment>
                <DocumentTitle title={['New Preview', 'Content Preview']} />
                <ContentPreviewFormPage
                  isNew
                  initialValue={initialValue}
                  registerSaveAction={this.props.registerSaveAction}
                  setDirty={this.props.setDirty}
                />
              </React.Fragment>
            );
          }}
        </ContentTypesFetcher>
      </AdminOnly>
    );
  }
}
