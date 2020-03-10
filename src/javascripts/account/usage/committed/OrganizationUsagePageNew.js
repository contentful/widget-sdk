import React from 'react';
import MainTabs from './tabs/MainTabs';

import PropTypes from 'prop-types';
import { periodicUsagePropType, periodPropType } from './propTypes';

import periodToDates from './charts/periodToDates';

const OrganizationUsagePageNew = props => {
  const period = periodToDates(props.period);
  const spaceNames = props.spaceNames;
  const { periodicUsage, apiRequestIncludedLimit, assetBandwidthData } = props;

  return (
    <MainTabs
      assetBandwidthData={assetBandwidthData}
      period={period}
      periodicUsage={periodicUsage}
      apiRequestIncludedLimit={apiRequestIncludedLimit}
      spaceNames={spaceNames}
    />
  );
};

OrganizationUsagePageNew.propTypes = {
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
  isLoading: PropTypes.bool.isRequired
};

export default OrganizationUsagePageNew;
