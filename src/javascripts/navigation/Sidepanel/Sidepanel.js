import React from 'react';
import PropTypes from 'prop-types';
import CloseIcon from 'svg/close';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { css } from 'emotion';
import SidepanelOrgs from './SidepanelOrgs';
import SidepanelSpaces from './SidepanelSpaces';
import SidepanelNoOrgs from './SidepanelNoOrgs';
import { Spinner } from '@contentful/forma-36-react-components';
import OrgActions from './OrgActions';
import * as TeamsFeature from 'app/OrganizationSettings/Teams/TeamsFeature';

const styles = {
  spinner: css({
    margin: '10px 20px'
  })
};

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
      return <Spinner size="small" className={styles.spinner} />;
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
