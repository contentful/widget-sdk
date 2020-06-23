import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { HelpText, TextLink } from '@contentful/forma-36-react-components';

import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';
import createResourceService from 'services/ResourceService';
import { getResourceLimits } from 'utils/ResourceUtils';

const warnThreshold = 0.9;
const errorThreshold = 0.95;

const openUpgradeModal = (space, onSubmit) =>
  showUpgradeSpaceDialog({
    organizationId: space.organization.sys.id,
    space,
    action: 'change',
    scope: 'space',
    onSubmit,
  });

const fetchRecordsResource = async (spaceId, environmentId) => {
  const resourceService = createResourceService(spaceId);
  return resourceService.get('record', environmentId);
};

export function RecordsResourceUsage({ space, environmentId, isMasterEnvironment }) {
  const [resource, setResource] = useState();

  const updateResource = useCallback(async () => {
    const recordResource = await fetchRecordsResource(space.sys.id, environmentId);

    setResource(recordResource);
  }, [space, environmentId]);

  useEffect(() => {
    updateResource();
  }, [updateResource]);

  if (!resource) {
    return null;
  }

  const resourceUsage = resource.usage;
  const resourceLimit = getResourceLimits(resource).maximum;
  const usagePercentage = resourceUsage / resourceLimit;

  return (
    <div
      data-test-id="container"
      className={classnames('resource-usage', {
        'resource-usage--warn':
          usagePercentage >= warnThreshold && usagePercentage < errorThreshold,
        'resource-usage--danger': usagePercentage >= errorThreshold,
      })}>
      {usagePercentage >= 1 ? (
        <HelpText>You’ve reached the limit of {resourceLimit} entries and assets. </HelpText>
      ) : (
        <HelpText>
          Usage: {resourceUsage} / {resourceLimit} entries and assets
        </HelpText>
      )}

      {usagePercentage >= warnThreshold && isMasterEnvironment && (
        <TextLink onClick={() => openUpgradeModal(space, updateResource)}>Upgrade space</TextLink>
      )}
    </div>
  );
}

RecordsResourceUsage.propTypes = {
  space: PropTypes.object,
  environmentId: PropTypes.string,
  isMasterEnvironment: PropTypes.bool,
};

export default RecordsResourceUsage;
