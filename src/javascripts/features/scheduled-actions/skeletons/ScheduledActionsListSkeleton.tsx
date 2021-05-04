import { SkeletonContainer, SkeletonText } from '@contentful/forma-36-react-components';
import React from 'react';

type ScheduledActionLoadingProps = {
  baseTop: number;
};

const ScheduledActionLoading = ({ baseTop }: ScheduledActionLoadingProps) => (
  <>
    <SkeletonText offsetTop={baseTop + 32.5} offsetLeft={0} lineHeight={20} width="15%" />
    <SkeletonText offsetTop={baseTop} offsetLeft="20%" lineHeight={40} width="80%" />
    <SkeletonText offsetTop={baseTop + 50} offsetLeft="20%" lineHeight={40} width="80%" />
  </>
);

const ScheduledActionsListPageLoading = () => (
  <SkeletonContainer svgWidth="100%" svgHeight={300} ariaLabel="Loading jobs list...">
    <SkeletonText offsetTop={20} offsetLeft={0} lineHeight={20} width="100%" />
    <ScheduledActionLoading baseTop={50} />
    <SkeletonText offsetTop={170} offsetLeft={0} lineHeight={20} width="100%" />
    <ScheduledActionLoading baseTop={200} />
  </SkeletonContainer>
);

export { ScheduledActionsListPageLoading, ScheduledActionLoading };
