import React, { Fragment } from 'react';
import Icon from 'ui/Components/Icon';

export default function SidepanelNoOrgs(props: { createNewOrg: () => void }) {
  const { createNewOrg } = props;

  return (
    <div className="nav-sidepanel__no-orgs" data-test-id="sidepanel-no-orgs">
      <Icon name="space" />
      <p className="nav-sidepanel__no-orgs-heading">Uh oh! Nothing to see here</p>

      <p>
        <Fragment>Seems like you aren&apos;t part of any organization. </Fragment>
        <a className="text-link" onClick={createNewOrg}>
          Create an organization
        </a>
        <Fragment> in the settings.</Fragment>
      </p>
    </div>
  );
}
