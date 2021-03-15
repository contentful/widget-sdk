import React, { useEffect, useState } from 'react';
import { Workbench, Notification } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import { LaunchAppDeepLinkSplash } from 'features/contentful-apps';
import { ReleasesProvider } from 'app/Releases/ReleasesWidget/ReleasesContext';
import { getReleaseById } from 'app/Releases/releasesService';
import { ReleasesLoadingOverlay } from 'app/Releases/ReleasesLoadingOverlay';
import StateRedirect from 'app/common/StateRedirect';

type ReleaseDetailsPageProps = {
  releaseId: string;
};

const ReleaseDetailsPage = ({ releaseId }: ReleaseDetailsPageProps) => {
  const [idValidation, setIdValidation] = useState({
    isValid: false,
    isValidating: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchRelease() {
      try {
        const fetchedRelease = await getReleaseById(releaseId);

        if (isMounted) {
          setIdValidation({
            isValid: !!fetchedRelease,
            isValidating: false,
          });
        }
      } catch (e) {
        if (isMounted) {
          setIdValidation({
            isValid: false,
            isValidating: false,
          });
        }
      }
    }

    fetchRelease();

    return () => {
      isMounted = false;
    };
  }, [releaseId]);

  if (idValidation.isValidating) {
    return <ReleasesLoadingOverlay message="Loading..." />;
  }

  if (!idValidation.isValid) {
    Notification.error('A release with such id does not exist in current space');
    return <StateRedirect path="spaces.detail.entries.list" />;
  }

  return (
    <Workbench>
      <DocumentTitle title="Release" />
      <LaunchAppDeepLinkSplash
        releaseId={releaseId}
        eventOrigin="release-details-page"
        text="You can now create and schedule releases from Launch"
        buttonText="View this release in Launch"
      />
    </Workbench>
  );
};

const ReleaseDetailPageContainer = (props: ReleaseDetailsPageProps) => (
  <ReleasesProvider>
    <ReleaseDetailsPage {...props} />
  </ReleasesProvider>
);

export { ReleaseDetailPageContainer as ReleaseDetailsPage };
