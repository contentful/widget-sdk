import React from 'react';
import PropTypes from 'prop-types';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import AppIcon from './AppIcon.es6';

const AppPageShell = ({ appId }) => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Header.Back to="^.list" />
      {appId ? (
        <Workbench.Icon>
          <AppIcon appId={appId} />
        </Workbench.Icon>
      ) : (
        <Workbench.Icon icon="page-apps" scale="1" />
      )}
    </Workbench.Header>
    <Workbench.Content centered>
      <SkeletonContainer ariaLabel="Loading app..." svgWidth={600}>
        <SkeletonBodyText numberOfLines={5} marginBottom={15} offsetTop={60} />
      </SkeletonContainer>
    </Workbench.Content>
  </Workbench>
);

AppPageShell.propTypes = {
  appId: PropTypes.string
};

export default AppPageShell;
