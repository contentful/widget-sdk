import React from 'react';
import PropTypes from 'prop-types';
import { getOrganization } from 'services/TokenStore.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import ForbiddenState from './ForbiddenState.es6';

export default class OrgAdminOnly extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    children: PropTypes.any,
    render: PropTypes.func,
    redirect: PropTypes.string
  };

  state = {
    isAdmin: false,
    isNotAMember: false,
    loading: true
  };

  async componentDidMount() {
    let organization;

    try {
      organization = await getOrganization(this.props.orgId);
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
