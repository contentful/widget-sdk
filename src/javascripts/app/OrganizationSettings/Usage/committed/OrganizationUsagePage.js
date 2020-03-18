import React from 'react';
import MainTabs from './tabs/MainTabs';

import PropTypes from 'prop-types';
import { periodicUsagePropType, periodPropType } from './propTypes';

import periodToDates from './charts/periodToDates';

const OrganizationUsagePage = ({
  spaceNames,
  period,
  periodicUsage,
  apiRequestIncludedLimit,
  assetBandwidthData,
  onTabSelect,
  isPoC
}) => {
  return (
    <MainTabs
      assetBandwidthData={assetBandwidthData}
      period={periodToDates(period)}
      periodicUsage={periodicUsage}
      apiRequestIncludedLimit={apiRequestIncludedLimit}
      spaceNames={spaceNames}
      isPoC={isPoC}
      onTabSelect={onTabSelect}
    />
  );
};

OrganizationUsagePage.propTypes = {
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
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
  isPoC: PropTypes.objectOf(PropTypes.bool).isRequired,
  onTabSelect: PropTypes.func
};

export default OrganizationUsagePage;
