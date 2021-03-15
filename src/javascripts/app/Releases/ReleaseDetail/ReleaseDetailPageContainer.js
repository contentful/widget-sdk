import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Workbench, Notification } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import { LaunchAppDeepLinkSplash } from 'features/contentful-apps';
import { ReleasesProvider } from '../ReleasesWidget/ReleasesContext';
import { getReleaseById } from '../releasesService';
import { ReleasesLoadingOverlay } from '../ReleasesLoadingOverlay';
import StateRedirect from 'app/common/StateRedirect';

const ReleaseDetailPage = ({ releaseId }) => {
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
      <LaunchAppDeepLinkSplash releaseId={releaseId} eventOrigin="release-details-page" />
    </Workbench>
  );
};

ReleaseDetailPage.propTypes = {
  releaseId: PropTypes.string.isRequired,
};

const ReleaseDetailPageContainer = (props) => (
  <ReleasesProvider>
    <ReleaseDetailPage {...props} />
  </ReleasesProvider>
);

export default ReleaseDetailPageContainer;
