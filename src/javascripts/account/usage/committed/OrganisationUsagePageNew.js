import React from 'react';
// import tokens from '@contentful/forma-36-tokens';
// import { css } from 'emotion';
// import OrgTabs from './tabs/OrgTabs';
import SpacesTabs from './tabs/SpacesTabs';
import PropTypes from 'prop-types';
import {
  organizationResourceUsagePropType,
  organizationUsagePropType,
  arrayPropType,
  periodPropType
} from './propTypes';
import periodToDates from './charts/periodToDates';

// const styles = {
//   panelHeading: css({
//     fontWeight: tokens.fontWeightMedium,
//     color: '#536171'
//   }),
//   spacesHeading: css({
//     fontWeight: tokens.fontWeightMedium,
//     color: '#6A7889',
//     marginBottom: tokens.spacingXl
//   })
// };

const OrganizationUsagePageNew = props => {
  const period = periodToDates(props.period);
  const spaceNames = props.spaceNames;
  const periodicUsage = props.periodicUsage;

  return (
    <>
      <OrgTabs {...props} />
      <SpacesTabs period={period} spaceNames={spaceNames} periodicUsage={periodicUsage} />
    </>
  );
};

const apiUsagePropType = arrayPropType(organizationResourceUsagePropType);

OrganizationUsagePageNew.propTypes = {
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  isPoC: PropTypes.objectOf(PropTypes.bool).isRequired,
  periodicUsage: PropTypes.shape({
    org: organizationUsagePropType,
    apis: PropTypes.shape({
      cma: apiUsagePropType,
      cda: apiUsagePropType,
      cpa: apiUsagePropType,
      gql: apiUsagePropType
    })
  }).isRequired,
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
