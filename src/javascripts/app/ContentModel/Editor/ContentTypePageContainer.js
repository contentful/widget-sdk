import React from 'react';
import { css } from 'emotion';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';

import { LoadingState } from 'features/loading-state';
import { FLAGS } from 'LaunchDarkly';
import { useFeatureFlagVariation } from 'app/Releases/ReleasesFeatureFlag';
import ContentTypesPageAngular from 'app/ContentModel/Editor/ContentTypesPage_deprecated';
import ContentTypesPageReact from 'app/ContentModel/Editor/ContentTypesPage';

const styles = {
  loaderWrapper: css({
    height: '100%',
  }),
};

const Container = (props) => {
  const { isSpaceFeatureLoading, spaceFeatureEnabled } = useFeatureFlagVariation(
    FLAGS.REACT_MIGRATION_CT,
    false
  );

  if (isSpaceFeatureLoading) {
    return (
      <Flex className={styles.loaderWrapper}>
        <LoadingState />
      </Flex>
    );
  }
  if (!isSpaceFeatureLoading && spaceFeatureEnabled) {
    return <ContentTypesPageReact {...props} />;
  }
  if (!isSpaceFeatureLoading && !spaceFeatureEnabled) {
    return <ContentTypesPageAngular {...props} />;
  }
  return null;
};

export default Container;
