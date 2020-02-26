import React from 'react';
// import tokens from '@contentful/forma-36-tokens';
// import { css } from 'emotion';
import OrgTabs from './tabs/OrgTabs';
import SpacesTabs from './tabs/SpacesTabs';

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
  return (
    <>
      <OrgTabs {...props} />
      <SpacesTabs {...props} />
    </>
  );
};

export default OrganizationUsagePageNew;
