import React from 'react';
import PropTypes from 'prop-types';
import $stateParams from '$stateParams';
import { getOrganization } from 'services/TokenStore.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import ForbiddenState from './ForbiddenState.es6';

export default class OrgAdminOnly extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    render: PropTypes.func,
    redirect: PropTypes.string
  };

  state = {
    isAdmin: false,
    isNotAMember: false,
    loading: true
  };

  static displayName = 'OrgAdminOnly';

  async componentDidMount() {
    const orgId = $stateParams.orgId;
    let organization;

    try {
      organization = await getOrganization(orgId);
      this.setState({ isAdmin: isOwnerOrAdmin(organization) });
    } catch (_) {
      // not a member or the org
    }

    this.setState({ loading: false });
  }

  render() {
    const { loading, isAdmin } = this.state;

    if (loading) return null;

    if (isAdmin) {
      return this.props.children;
    }

    if (this.props.render) {
      return this.props.render(<ForbiddenState />);
    }

    return <ForbiddenState />;
  }
}
