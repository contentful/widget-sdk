import React from 'react';
import { useFeatureFlagVariation } from 'app/Releases/ReleasesFeatureFlag';
import { FLAGS } from 'LaunchDarkly';
import { Search as LegacySearch } from './View';
import type { EntityType } from '@contentful/entity-search/dist/types';
import { EntitySearch } from './EntitySearch';

import { SkeletonContainer, SkeletonDisplayText } from '@contentful/forma-36-react-components';

type EntitySearchProps = {
  className: string;
  contentTypes: any[];
  entityType: EntityType;
  isLoading?: boolean;
  withMetadata: boolean;
  onUpdate: Function;
  listViewContext: any;
};

export function SearchProxy(props: EntitySearchProps) {
  const { isSpaceFeatureLoading, spaceFeatureEnabled } = useFeatureFlagVariation(
    FLAGS.ENTITY_SEARCH,
    false
  );

  if (isSpaceFeatureLoading) {
    return (
      <SkeletonContainer svgHeight={40}>
        <SkeletonDisplayText width={680} lineHeight={40} />
      </SkeletonContainer>
    );
  }

  if (spaceFeatureEnabled) {
    const searchProps = {
      ...props,
      isLoading: props.isLoading || isSpaceFeatureLoading,
    };

    return <EntitySearch {...searchProps} />;
  }

  const legacyProps = {
    ...props,
    readableContentTypes: props.contentTypes,
    isLoading: props.isLoading || isSpaceFeatureLoading,
  };

  return <LegacySearch {...legacyProps} />;
}
