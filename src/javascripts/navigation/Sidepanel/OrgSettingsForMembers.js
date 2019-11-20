import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Spinner } from '@contentful/forma-36-react-components';
import OrgActions from './OrgActions';
import * as TeamsFeature from 'app/OrganizationSettings/Teams/TeamsFeature';

const styles = {
  spinner: css({
    margin: '10px 20px'
  })
};

export default class OrgSettingsForMembers extends React.Component {
  static propTypes = {
    gotoOrgSettings: PropTypes.func,
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
        <OrgActions gotoOrgSettings={this.props.gotoOrgSettings} showOrgSettingsAsTeams={true} />
      );
    }

    return null;
  }
}
