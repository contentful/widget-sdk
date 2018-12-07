import React from 'react';
import { List as SkeletonList } from 'react-content-loader';
import Workbench from 'app/common/Workbench.es6';

const AppPageShell = () => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Header.Back to="^.list" />
      <Workbench.Icon icon="page-apps" scale="1" />
    </Workbench.Header>
    <Workbench.Content centered>
      <div className="app-page-skeleton">
        <SkeletonList style={{ marginTop: 20 }} />
      </div>
    </Workbench.Content>
  </Workbench>
);

export default AppPageShell;
