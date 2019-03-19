import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ROUTES from 'redux/routes.es6';
import Placeholder from 'app/common/Placeholder.es6';
import { getPath } from 'redux/selectors/location.es6';
import { isMissingRequiredDatasets } from 'redux/selectors/datasets.es6';
import { getReasonDenied, hasAccess } from 'redux/selectors/access.es6';
import getOrganization from 'redux/selectors/getOrganization.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import { FEATURE_INACTIVE } from 'redux/accessConstants.es6';
import { Organization as OrganizationPropType } from '../PropTypes.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';

import TeamList from './TeamList.es6';
import TeamDetails from './TeamDetails.es6';
import TeamsEmptyState from './TeamsEmptyState.es6';

class TeamPage extends React.Component {
  static propTypes = {
    onReady: PropTypes.func.isRequired,
    showList: PropTypes.bool.isRequired,
    showDetails: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    hasAccess: PropTypes.bool.isRequired,
    organization: OrganizationPropType,
    deniedReason: PropTypes.string
  };

  state = {
    spaceMembershipsEnabled: false
  };

  async componentDidMount() {
    if (this.props.showDetails) {
      const spaceMembershipsEnabled = await getCurrentVariation(
        'feature-bv-01-2019-team-space-memberships'
      );
      this.setState({ spaceMembershipsEnabled });
    }

    if (!this.props.isLoading) {
      this.props.onReady();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isLoading && !this.props.isLoading) {
      this.props.onReady();
    }
  }

  render() {
    const { hasAccess, deniedReason, showList, showDetails, isLoading, organization } = this.props;
    if (!hasAccess) {
      if (deniedReason === FEATURE_INACTIVE) {
        return <TeamsEmptyState isLegacy={true} isAdmin={isOwnerOrAdmin(organization)} />;
      } else {
        const text =
          'It seems you are not allowed to see this page. Please contact you administrator.';
        return (
          <Placeholder
            testId="access-denied-placeholder"
            text={text}
            title="No access to Teams page"
          />
        );
      }
    }
    if (isLoading) {
      return null;
    }
    if (showList) {
      return <TeamList />;
    }
    if (showDetails) {
      return <TeamDetails spaceMembershipsEnabled={this.state.spaceMembershipsEnabled} />;
    }
    // this will never be reached, because angular handles 404 for this case
    // if we remove that from angular at some point, this would be a possible place
    // to return a 404 page
    return '404 not found';
  }
}

export default connect(state => {
  const path = getPath(state);
  return {
    showList: ROUTES.organization.children.teams.test(path) !== null,
    showDetails: ROUTES.organization.children.teams.children.team.test(path) !== null,
    isLoading: isMissingRequiredDatasets(state),
    hasAccess: hasAccess(state),
    deniedReason: getReasonDenied(state),
    organization: getOrganization(state)
  };
})(TeamPage);
