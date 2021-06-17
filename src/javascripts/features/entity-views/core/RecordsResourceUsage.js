import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { HelpText, TextLink } from '@contentful/forma-36-react-components';

import { beginSpaceChange } from 'services/ChangeSpaceService';
import { getResourceLimits } from 'utils/ResourceUtils';
import { WARNING_THRESHOLD } from 'services/PricingService';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';

const ERROR_THRESHOLD = 0.95;

const openUpgradeModal = (space, onSubmit) =>
  beginSpaceChange({
    organizationId: space.organization.sys.id,
    space,
    onSubmit,
  });

export function RecordsResourceUsage({ className }) {
  const { currentSpace, spaceData, environmentResources } = useSpaceEnvContext();
  const [resource, setResource] = useState();

  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);

  const updateResource = useCallback(async () => {
    const recordResource = await environmentResources.get('record');

    setResource(recordResource);
  }, [environmentResources]);

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
      className={classnames('resource-usage', className, {
        'resource-usage--warn':
          usagePercentage >= WARNING_THRESHOLD && usagePercentage < ERROR_THRESHOLD,
        'resource-usage--danger': usagePercentage >= ERROR_THRESHOLD,
      })}>
      {usagePercentage >= 1 ? (
        <HelpText>You’ve reached the limit of {resourceLimit} entries and assets. </HelpText>
      ) : (
        <HelpText>
          Usage: {resourceUsage} / {resourceLimit} entries and assets
        </HelpText>
      )}

      {usagePercentage >= WARNING_THRESHOLD && isMasterEnvironment && (
        <TextLink onClick={() => openUpgradeModal(spaceData, updateResource)}>
          Upgrade space
        </TextLink>
      )}
    </div>
  );
}

RecordsResourceUsage.propTypes = {
  className: PropTypes.string,
};
