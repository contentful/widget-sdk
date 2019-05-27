import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import TeamsEmptyStateImage from 'svg/add-team-illustration.es6';
import { Heading, Paragraph, Button } from '@contentful/forma-36-react-components';
import TeamDialog from './TeamDialog.es6';
import { supportUrl } from 'Config.es6';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer.es6';

const styles = {
  pageWrapper: css({ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 })
};

export default class TeamsEmptyState extends React.Component {
  static propTypes = {
    isLegacy: PropTypes.bool,
    isEmpty: PropTypes.bool,
    isAdmin: PropTypes.bool
  };

  state = {
    showingDialog: false
  };

  toggleDialog() {
    this.setState({ showingDialog: !this.state.showingDialog });
  }

  renderAdminWarning() {
    return this.props.isLegacy ? (
      <>
        <Paragraph>
          The team feature is available on our platform plans, along with detailed usage insights,
          space environments, the user management API and more. To upgrade your space, get in touch
          with us.
        </Paragraph>
        <Button
          testId="get-in-touch-button"
          className="f36-margin-top--l"
          href={`${supportUrl}?upgrade-teams=true`}
          target="_blank">
          Get in touch with us
        </Button>
      </>
    ) : (
      <Button testId="add-a-team-button" onClick={() => this.toggleDialog()}>
        Add a team
      </Button>
    );
  }
  renderPractitionerWarning() {
    return <>To access the team feature, talk with your organization admin. </>;
  }

  render() {
    const { isAdmin } = this.props;

    return (
      <div className={styles.pageWrapper}>
        <EmptyStateContainer>
          <div className={defaultSVGStyle}>
            <TeamsEmptyStateImage />
          </div>
          <Heading>Come together in a team</Heading>
          <Paragraph>
            The team feature brings greater visibility to the web app. Everyone in a team can see
            members of their team.
          </Paragraph>
          {isAdmin ? this.renderAdminWarning() : this.renderPractitionerWarning()}
        </EmptyStateContainer>
        <TeamDialog
          testId="create-team-dialog"
          onClose={() => this.toggleDialog()}
          isShown={this.state.showingDialog}
        />
      </div>
    );
  }
}
