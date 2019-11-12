import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import TeamsEmptyStateImage from 'svg/add-team-illustration';
import { Heading, Paragraph, Button } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import TeamDialog from './TeamDialog';
import { supportUrl } from 'Config';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';

const styles = {
  pageWrapper: css({ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }),
  topMargin: css({ marginTop: tokens.spacingL })
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
          The team feature is available on our enterprise-grade platform plans. To add teams to your
          plan, get in touch with us.
        </Paragraph>
        <Button
          testId="get-in-touch-button"
          className={styles.topMargin}
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
    return <Paragraph>To access the team feature, talk with your organization admin.</Paragraph>;
  }

  render() {
    const { isAdmin } = this.props;

    return (
      <div className={styles.pageWrapper}>
        <EmptyStateContainer>
          <div className={defaultSVGStyle}>
            <TeamsEmptyStateImage />
          </div>
          <Heading>Bring users together in a team</Heading>
          <Paragraph>
            Group people together by space roles or a shared project. Team members can see other
            people in their team and collaborate with more visibility.
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
