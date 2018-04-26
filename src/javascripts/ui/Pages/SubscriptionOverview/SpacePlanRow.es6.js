import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {joinAnd} from 'stringUtils';

import { get } from 'lodash';

import { go } from 'states/Navigator';

import { getEnabledFeatures } from 'utils/SubscriptionUtils';
import { getUserName } from 'utils/UserUtils';

import { home, usage as spaceUsage } from 'ui/NavStates/Space';
import HelpIcon from 'ui/Components/HelpIcon';
import Price from 'ui/Components/Price';
import ContextMenu from 'ui/Components/ContextMenu';

function SpacePlanRow ({ plan, onChangeSpace, onDeleteSpace }) {
  const space = plan.space;
  const enabledFeatures = getEnabledFeatures(plan);
  const hasAnyFeatures = enabledFeatures.length > 0;
  const key = plan.sys.id || plan.space && plan.space.sys.id;

  let createdBy = '';
  let createdAt = '';

  if (space) {
    createdBy = getUserName(space.sys.createdBy || {});
    createdAt = moment.utc(space.sys.createdAt).format('DD/MM/YYYY');
  }

  const contextMenuItems = [
    {
      label: 'Upgrade space',
      action: onChangeSpace(space, 'upgrade'),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.upgrade-space-link'
      }
    },
    {
      label: 'Go to space',
      disabled: Boolean(space && !space.isAccessible),
      action: () => go(home(space.sys.id)),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.space-link'
      }
    },
    {
      label: 'Usage',
      disabled: Boolean(space && !space.isAccessible),
      action: () => go(spaceUsage(space.sys.id)),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.space-usage-link'
      }
    },
    {
      label: 'Delete',
      action: onDeleteSpace(space),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.delete-space-link'
      }
    }
  ];

  return <tr key={key}>
    <td><strong>{get(space, 'name', '-')}</strong></td>
    <td>
      <strong>{plan.name}</strong>
      { hasAnyFeatures &&
        <HelpIcon>This space includes {joinAnd(enabledFeatures.map(({name}) => name))}</HelpIcon>
      }
      <br />
      <Price value={plan.price} unit='month' />
    </td>
    <td>{createdBy}</td>
    <td>{createdAt}</td>
    <td style={{textAlign: 'right'}}>
      { space &&
        <ContextMenu
          data-test-id='subscription-page.spaces-list.space-context-menu'
          items={contextMenuItems}
        />
      }
    </td>
  </tr>;
}

SpacePlanRow.propTypes = {
  plan: PropTypes.object.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  isOrgOwner: PropTypes.bool.isRequired
};

export default SpacePlanRow;
