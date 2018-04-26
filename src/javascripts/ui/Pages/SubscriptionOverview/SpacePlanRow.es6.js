import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {joinAnd} from 'stringUtils';

import { get } from 'lodash';

import { getEnabledFeatures } from 'utils/SubscriptionUtils';
import { getUserName } from 'utils/UserUtils';

import HelpIcon from 'ui/Components/HelpIcon';
import Price from 'ui/Components/Price';

import { getSpaceActionLinks } from './utils';

function SpacePlanRow ({plan, onDeleteSpace, isOrgOwner}) {
  const space = plan.space;
  const enabledFeatures = getEnabledFeatures(plan);
  const hasAnyFeatures = enabledFeatures.length > 0;
  const key = plan.sys.id || plan.space && plan.space.sys.id;

  let actionLinks = [];
  let createdBy = '';
  let createdAt = '';

  if (space) {
    createdBy = getUserName(space.sys.createdBy || {});
    createdAt = moment.utc(space.sys.createdAt).format('DD/MM/YYYY');
    actionLinks = getSpaceActionLinks(space, isOrgOwner, onDeleteSpace);
  }

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
    <td>{actionLinks.spaceLink} {actionLinks.usageLink} {actionLinks.deleteLink}</td>
  </tr>;
}

SpacePlanRow.propTypes = {
  plan: PropTypes.object.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  isOrgOwner: PropTypes.bool.isRequired
};

export default SpacePlanRow;
