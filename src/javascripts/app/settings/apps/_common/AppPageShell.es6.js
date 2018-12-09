import React from 'react';
import PropTypes from 'prop-types';
import { List as SkeletonList } from 'react-content-loader';
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
      <div className="app-page-skeleton">
        <SkeletonList style={{ marginTop: 20 }} />
      </div>
    </Workbench.Content>
  </Workbench>
);

AppPageShell.propTypes = {
  appId: PropTypes.string
};

export default AppPageShell;
