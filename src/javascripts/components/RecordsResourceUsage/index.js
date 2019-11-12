import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { get } from 'lodash';

import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';

import createResourceService from 'services/ResourceService';
import { TextLink } from '@contentful/forma-36-react-components';

const openUpgradeModal = (space, onSubmit) =>
  showUpgradeSpaceDialog({
    organizationId: space.organization.sys.id,
    space,
    action: 'change',
    scope: 'space',
    onSubmit
  });

const fetchRecordsResource = (spaceId, environmentId) => {
  const service = createResourceService(spaceId);

  return service.get('record', environmentId);
};

export default function RecordsResourceUsage({
  space,
  environmentId,
  isMasterEnvironment,
  currentTotal
}) {
  const [resource, setResource] = useState(null);
  const spaceId = space.sys.id;

  const updateResource = useCallback(async () => {
    const recordResource = await fetchRecordsResource(spaceId, environmentId);

    setResource(recordResource);
  }, [spaceId, environmentId]);

  useEffect(() => {
    const update = updateResource;

    update();
  }, [currentTotal, updateResource]);

  if (!resource) {
    return null;
  }

  const usage = get(resource, 'usage');
  const limit = get(resource, 'limits.maximum');

  const warnThreshold = 0.9;
  const errorThreshold = 0.95;

  const usagePercentage = usage / limit;
  const atLimit = usagePercentage >= 1;

  return (
    <div
      data-test-id="container"
      className={classnames('resource-usage', {
        'resource-usage--warn': usage / limit >= warnThreshold && usage / limit < errorThreshold,
        'resource-usage--danger': usage / limit >= errorThreshold
      })}>
      {atLimit && <span>You’ve reached the limit of {limit} entries and assets. </span>}
      {!atLimit && (
        <span>
          Usage: {usage} / {limit} entries and assets{' '}
        </span>
      )}
      {usagePercentage >= warnThreshold && isMasterEnvironment && (
        <TextLink onClick={() => openUpgradeModal(space, updateResource)}>Upgrade space</TextLink>
      )}
    </div>
  );
}

RecordsResourceUsage.propTypes = {
  space: PropTypes.object.isRequired,
  environmentId: PropTypes.string.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
  currentTotal: PropTypes.number.isRequired
};

export { RecordsResourceUsage };
