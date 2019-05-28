import React from 'react';
import PropTypes from 'prop-types';
import CloseIcon from 'svg/close.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import SidepanelOrgs from './SidepanelOrgs.es6';
import SidepanelSpaces from './SidepanelSpaces.es6';
import SidepanelNoOrgs from './SidepanelNoOrgs.es6';
import { Spinner } from '@contentful/forma-36-react-components';
import OrgActions from './OrgActions.es6';
import * as TeamsFeature from 'app/OrganizationSettings/Teams/TeamsFeature.es6';

export default class Sidepanel extends React.Component {
  static propTypes = {
    sidePanelIsShown: PropTypes.bool,
    closeOrgsDropdown: PropTypes.func,
    closeSidePanel: PropTypes.func,
    gotoOrgSettings: PropTypes.func,
    viewingOrgSettings: PropTypes.any,
    currOrg: PropTypes.object
  };

  render() {
    const {
      sidePanelIsShown,
      closeOrgsDropdown,
      closeSidePanel,
      gotoOrgSettings,
      viewingOrgSettings,
      currOrg
    } = this.props;

    return (
      <div
        className={`nav-sidepanel ${sidePanelIsShown ? 'nav-sidepanel--is-active' : ''}`}
        aria-hidden={sidePanelIsShown ? 'false' : 'true'}
        onClick={closeOrgsDropdown}
        data-test-id="sidepanel">
        {currOrg && (
          <React.Fragment>
            <SidepanelOrgs {...this.props} />
            <SidepanelSpaces {...this.props} />
            {isOwnerOrAdmin(currOrg) ? (
              <OrgActions
                gotoOrgSettings={gotoOrgSettings}
                viewingOrgSettings={viewingOrgSettings}
                showOrgSettingsAsTeams={false}
              />
            ) : (
              <OrgSettingsForMembers
                gotoOrgSettings={gotoOrgSettings}
                viewingOrgSettings={viewingOrgSettings}
                currOrg={currOrg}
                key={currOrg.sys.id}
              />
            )}
          </React.Fragment>
        )}
        {!currOrg && <SidepanelNoOrgs {...this.props} />}

        <div
          className="nav-sidepanel__close-btn"
          onClick={closeSidePanel}
          data-test-id="sidepanel-close-btn">
          <CloseIcon />
        </div>
      </div>
    );
  }
}

class OrgSettingsForMembers extends React.Component {
  static propTypes = {
    gotoOrgSettings: PropTypes.func,
    viewingOrgSettings: PropTypes.any,
    currOrg: PropTypes.object
  };

  state = { isLoading: true };

  async componentDidMount() {
    this.setState({
      isLoading: false,
      shouldSeeTeams: await TeamsFeature.isEnabled(this.props.currOrg)
    });
  }

  render() {
    if (this.state.isLoading) {
      return <Spinner size="small" style={{ margin: '10px 20px' }} />;
    }

    if (this.state.shouldSeeTeams) {
      return (
        <OrgActions
          gotoOrgSettings={this.props.gotoOrgSettings}
          viewingOrgSettings={this.props.viewingOrgSettings}
          showOrgSettingsAsTeams={true}
        />
      );
    }

    return null;
  }
}
