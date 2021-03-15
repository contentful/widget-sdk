import React from 'react';
import { Workbench } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import { LaunchAppDeepLinkSplash } from 'features/contentful-apps';

const ReleasesListPage = () => {
  return (
    <Workbench>
      <DocumentTitle title="Release" />
      <LaunchAppDeepLinkSplash
        eventOrigin="release-list-page"
        text="You can now view your releases in Launch"
        buttonText="Open Launch"
      />
    </Workbench>
  );
};

export { ReleasesListPage };
