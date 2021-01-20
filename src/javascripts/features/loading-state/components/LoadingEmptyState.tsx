import React from 'react';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { LoadingState } from './LoadingState';

interface LoadingEmptyStateProps {
  testId?: string;
}

export function LoadingEmptyState({ testId }: LoadingEmptyStateProps): React.ReactElement {
  return (
    <EmptyStateContainer>
      <LoadingState testId={testId} />
    </EmptyStateContainer>
  );
}
