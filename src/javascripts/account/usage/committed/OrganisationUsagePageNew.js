import React from 'react';
import OrgTabs from './tabs/OrgTabs';
import SpacesTabs from './tabs/SpacesTabs';
import PropTypes from 'prop-types';
import { periodicUsagePropType, periodPropType } from './propTypes';
import periodToDates from './charts/periodToDates';

const OrganizationUsagePageNew = props => {
  const period = periodToDates(props.period);
  const spaceNames = props.spaceNames;
  const periodicUsage = props.periodicUsage;

  return (
    <>
      <OrgTabs period={period} {...props} />
      <SpacesTabs period={period} spaceNames={spaceNames} periodicUsage={periodicUsage} />
    </>
  );
};

OrganizationUsagePageNew.propTypes = {
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  isPoC: PropTypes.objectOf(PropTypes.bool).isRequired,
  periodicUsage: periodicUsagePropType.isRequired,
  period: periodPropType,
  apiRequestIncludedLimit: PropTypes.number.isRequired,
  assetBandwidthData: PropTypes.shape({
    usage: PropTypes.number,
    unitOfMeasure: PropTypes.string,
    limits: PropTypes.shape({
      included: PropTypes.number
    })
  }),
  isLoading: PropTypes.bool.isRequired
};

export default OrganizationUsagePageNew;
