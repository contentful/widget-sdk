import React from 'react';
import PropTypes from 'prop-types';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import AppIcon from './AppIcon.es6';
import Icon from 'ui/Components/Icon.es6';

const AppPageShell = ({ appId }) => (
  <Workbench>
    <Workbench.Header
      icon={appId ? <AppIcon appId={appId} /> : <Icon name="page-apps" scale="1" />}
    />
    <Workbench.Content type="text">
      <SkeletonContainer ariaLabel="Loading app..." svgWidth="100%" svgHeight="300px">
        <SkeletonBodyText numberOfLines={5} marginBottom={15} offsetTop={60} />
      </SkeletonContainer>
    </Workbench.Content>
  </Workbench>
);

AppPageShell.propTypes = {
  appId: PropTypes.string
};

export default AppPageShell;
