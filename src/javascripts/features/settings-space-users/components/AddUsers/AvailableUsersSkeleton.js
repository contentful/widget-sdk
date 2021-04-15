import React from 'react';
import {
  SkeletonContainer,
  SkeletonImage,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export function AvailableUsersSkeleton() {
  return (
    <div data-test-id="add-users.user-list.skeleton">
      <UserSkeleton />
      <UserSkeleton />
      <UserSkeleton />
      <UserSkeleton />
      <UserSkeleton />
    </div>
  );
}

function UserSkeleton() {
  const style = css({ margin: `${tokens.spacingM}` });

  return (
    <div className={style}>
      <SkeletonContainer svgHeight={44} clipId="user-avatar">
        <SkeletonImage width={32} height={32} radiusX="100%" radiusY="100%" />
        <SkeletonBodyText numberOfLines={2} width={200} offsetLeft={52} />
      </SkeletonContainer>
    </div>
  );
}
