import React from 'react';
import PropTypes from 'prop-types';
import WavyBackground from 'svg/wavy-background.es6';
import TeamsEmptyStateImage from 'svg/empty-state-teams.es6';
import { Heading, Paragraph, Button, Tooltip } from '@contentful/forma-36-react-components';
import ContactUsButton from 'ui/Components/ContactUsButton.es6';
import TeamDialog from './TeamDialog.es6';

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

  renderEmptyWarning() {
    return this.props.isAdmin ? (
      <Button onClick={() => this.toggleDialog()}>New Team</Button>
    ) : (
      <React.Fragment>
        <Paragraph className="f36-margin-bottom--m">{`You're not a member of any teams yet.`}</Paragraph>
        <Tooltip
          testId="read-only-tooltip"
          place="top"
          content="You don't have permission to create new teams">
          <Button disabled testId="new-team-button">
            New team
          </Button>
        </Tooltip>
      </React.Fragment>
    );
  }

  renderLegacyWarning() {
    return (
      <React.Fragment>
        <Paragraph className="f36-margin-bottom--m">
          Teams are available on our new platform plans, along with detailed usage insights, space
          environments, user management API and more.
        </Paragraph>

        {this.props.isAdmin ? (
          <React.Fragment>
            <Paragraph className="f36-margin-bottom--m">
              Let us know if you’re interested in upgrading.
            </Paragraph>
            <ContactUsButton buttonType="button" noIcon />
          </React.Fragment>
        ) : (
          <Paragraph>Talk to you Organization admin about using Teams.</Paragraph>
        )}
      </React.Fragment>
    );
  }

  render() {
    const { isLegacy } = this.props;

    return (
      <div className="illustrated-empty-state">
        <WavyBackground
          className="illustrated-empty-state__background"
          preserveAspectRatio={'none'}
        />
        <TeamsEmptyStateImage
          className="illustrated-empty-state__illustration"
          style={{ marginTop: -200 }}
        />
        <div className="illustrated-empty-state__content">
          <Heading element="h2" className="f36-margin-top--4xl f36-margin-bottom--m">
            Improved visibility with Teams
          </Heading>
          <Paragraph className="f36-margin-bottom--m">
            Everyone in a Team can see other members of that Team.
          </Paragraph>

          {isLegacy ? this.renderLegacyWarning() : this.renderEmptyWarning()}

          <Paragraph className="f36-margin-top--4xl" style={{ opacity: 0.4 }}>
            Illustrations by{' '}
            <a href="https://www.pablostanley.com/" target="_blank" rel="noopener noreferrer">
              Pablo Stanley
            </a>
          </Paragraph>
        </div>
        <TeamDialog
          testId="create-team-dialog"
          onClose={() => this.toggleDialog()}
          isShown={this.state.showingDialog}
        />
      </div>
    );
  }
}
