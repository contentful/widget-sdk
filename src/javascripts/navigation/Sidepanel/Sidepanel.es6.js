import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get, debounce } from 'lodash';
import CloseIcon from 'svg/close.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import hasOrgTeamFeature from 'redux/selectors/hasOrgTeamFeature.es6';
import { getOrgConstants } from 'redux/selectors/getOrgConstants.es6';
import { fetchOrgConstants } from 'redux/actions/orgConstants/actionCreators.es6';
import SidepanelOrgs from './SidepanelOrgs.es6';
import SidepanelSpaces from './SidepanelSpaces.es6';
import SidepanelProjects from './__PROTOTYPE__SidepanelProjects.es6';
import SidepanelNoOrgs from './SidepanelNoOrgs.es6';
import { Spinner } from '@contentful/forma-36-react-components';
import OrgActions from './OrgActions.es6';

class Sidepanel extends React.Component {
  static propTypes = {
    sidePanelIsShown: PropTypes.bool,
    closeOrgsDropdown: PropTypes.func,
    closeSidePanel: PropTypes.func,
    gotoOrgSettings: PropTypes.func,
    viewingOrgSettings: PropTypes.any,
    currOrg: PropTypes.object,
    teamsFeatureEnabled: PropTypes.bool,
    teamsForMembersFF: PropTypes.bool,
    orgConstants: PropTypes.object,
    fetchOrgConstants: PropTypes.func
  };

  componentDidUpdate(prevProps) {
    const { currOrg } = this.props;
    if (currOrg && prevProps.currOrg !== currOrg) {
      this.debouncedFetchOrgConstants(this.props.currOrg.sys.id);
    }
  }

  debouncedFetchOrgConstants = debounce(this.props.fetchOrgConstants, 200);

  renderOrgSettingsForMembers() {
    const {
      orgConstants,
      teamsFeatureEnabled,
      teamsForMembersFF,
      gotoOrgSettings,
      viewingOrgSettings
    } = this.props;
    const isEnterprise = get(orgConstants, ['isEnterprise'], false);
    const isLegacy = get(orgConstants, ['isLegacy'], false);
    const isLegacyEnterprise = isLegacy && isEnterprise;
    // who can see the Teams button:
    // - members of V1 Enterprise orgs
    // - members of V2 orgs with the Teams feature enabled
    const shouldSeeTeams = teamsForMembersFF && (teamsFeatureEnabled || isLegacyEnterprise);
    const isLoading = get(orgConstants, ['meta', 'isPending'], true);

    return isLoading ? (
      <Spinner size="small" style={{ margin: '10px 20px' }} />
    ) : (
      shouldSeeTeams && (
        <OrgActions
          gotoOrgSettings={gotoOrgSettings}
          viewingOrgSettings={viewingOrgSettings}
          showOrgSettingsAsTeams={true}
        />
      )
    );
  }

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
        aria-hidden={sidePanelIsShown ? '' : 'true'}
        onClick={closeOrgsDropdown}
        data-test-id="sidepanel">
        {currOrg && (
          <React.Fragment>
            <SidepanelOrgs {...this.props} />
            <SidepanelProjects {...this.props} />
            <SidepanelSpaces {...this.props} />
            {isOwnerOrAdmin(currOrg) ? (
              <OrgActions
                gotoOrgSettings={gotoOrgSettings}
                viewingOrgSettings={viewingOrgSettings}
                showOrgSettingsAsTeams={false}
              />
            ) : (
              this.renderOrgSettingsForMembers()
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

export default connect(
  (state, { currOrg }) => {
    const orgId = get(currOrg, 'sys.id', null);
    return {
      teamsFeatureEnabled: hasOrgTeamFeature(state, { orgId }),
      orgConstants: getOrgConstants(state, { orgId })
    };
  },
  dispatch => ({
    fetchOrgConstants: orgId => dispatch(fetchOrgConstants(orgId))
  })
)(Sidepanel);
