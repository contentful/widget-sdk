import React from 'react';

import { TextLink } from '@contentful/ui-component-library';

import { href } from 'states/Navigator';
import { home, usage as spaceUsage } from 'ui/NavStates/Space';

import Tooltip from 'ui/Components/Tooltip';

export function getSpaceActionLinks(space, isOrgOwner, onDeleteSpace) {
  const actionLinkStyle = {
    margin: '0 10px 0 0',
    display: 'inline',
    whiteSpace: 'nowrap'
  };
  const tooltip = (
    <div style={{ whiteSpace: 'normal' }}>
      You don&apos;t have access to this space. But since you&apos;re an organization{' '}
      {isOrgOwner ? 'owner' : 'admin'} you can grant yourself access by going to <i>users</i> and
      adding yourself to the space.
    </div>
  );

  let spaceLink = (
    <TextLink
      extraClassNames="text-link"
      href={(space.isAccessible && href(home(space.sys.id))) || undefined}
      disabled={!space.isAccessible}
      style={actionLinkStyle}
      data-test-id="subscription-page.spaces-list.space-link">
      Go to space
    </TextLink>
  );
  let usageLink = (
    <TextLink
      extraClassNames="text-link"
      href={(space.isAccessible && href(spaceUsage(space.sys.id))) || undefined}
      disabled={!space.isAccessible}
      style={actionLinkStyle}
      data-test-id="subscription-page.spaces-list.space-usage-link">
      Usage
    </TextLink>
  );

  if (!space.isAccessible) {
    spaceLink = (
      <Tooltip tooltip={tooltip} style={actionLinkStyle}>
        {spaceLink}
      </Tooltip>
    );
    usageLink = (
      <Tooltip tooltip={tooltip} style={actionLinkStyle}>
        {usageLink}
      </Tooltip>
    );
  }

  const deleteLink = (
    <button
      className="text-link text-link--destructive"
      style={actionLinkStyle}
      onClick={onDeleteSpace(space)}
      data-test-id="subscription-page.spaces-list.delete-space-link">
      Delete
    </button>
  );

  return {
    spaceLink,
    usageLink,
    deleteLink
  };
}

export function hasAnyInaccessibleSpaces(plans) {
  return plans.some(plan => {
    const space = plan.space;
    return space && !space.isAccessible;
  });
}

export function hasAnyCommittedSpaces(plans) {
  return plans.some(plan => {
    const space = plan.space;
    return space && plan.committed;
  });
}
