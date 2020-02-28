import React from 'react';
import OrgTabs from './tabs/OrgTabs';
import SpacesTabs from './tabs/SpacesTabs';
import PropTypes from 'prop-types';
import { periodicUsagePropType, periodPropType } from './propTypes';
import { Heading } from '@contentful/forma-36-react-components';
import periodToDates from './charts/periodToDates';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  heading: css({
    color: '#6A7889',
    fontWeight: tokens.fontWeightNormal,
    paddingBottom: tokens.spacingXl
  })
};

const OrganizationUsagePageNew = props => {
  const period = periodToDates(props.period);
  const spaceNames = props.spaceNames;
  const { periodicUsage, apiRequestIncludedLimit } = props;

  return (
    <>
      <OrgTabs
        period={period}
        periodicUsage={periodicUsage}
        apiRequestIncludedLimit={apiRequestIncludedLimit}
      />
      <Heading element="h2" className={styles.heading}>
        View API requests by type and space
      </Heading>
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
