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
import Tooltip from 'ui/Components/Tooltip';
import Price from 'ui/Components/Price';
import ContextMenu from 'ui/Components/ContextMenu';

function SpacePlanRow ({ plan, upgraded, onChangeSpace, onDeleteSpace }) {
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
      label: 'Change space type',
      action: onChangeSpace(plan, space, 'change'),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.change-space-link'
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
      action: onDeleteSpace(plan, space),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.delete-space-link'
      }
    }
  ];

  const className = upgraded ? 'x--success' : '';

  return <tr className={className} key={key}>
    <td>
      <strong>{get(space, 'name', '-')}</strong>
      { plan.committed &&
        <Tooltip
          style={{fontSize: '12px'}}
          tooltip="This space is part of your Enterprise deal with Contentful"
          className="help-icon"
        >★</Tooltip>
      }
    </td>
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
          style={{top: '8px'}}
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
  isOrgOwner: PropTypes.bool.isRequired,
  upgraded: PropTypes.bool
};

export default SpacePlanRow;
