import React from 'react';
import PropTypes from 'prop-types';
import WavyBackground from 'svg/wavy-background.es6';
import TeamsEmptyStateImage from 'svg/empty-state-teams.es6';
import { Heading, Paragraph, Button, Tooltip } from '@contentful/forma-36-react-components';
import ContactUsButton from 'ui/Components/ContactUsButton.es6';

export default class TeamsEmptyState extends React.Component {
  static propTypes = {
    isLegacy: PropTypes.bool,
    isEmpty: PropTypes.bool,
    isAdmin: PropTypes.bool,
    onNewTeam: PropTypes.func
  };

  renderEmptyWarning() {
    return (
      <React.Fragment>
        <Paragraph className="f36-margin-bottom--xl">{`You're not a member of any teams yet.`}</Paragraph>
        {this.props.isAdmin ? (
          <Button onClick={this.props.onNewTeam}>New Team</Button>
        ) : (
          <Tooltip
            testId="read-only-tooltip"
            place="top"
            content="You don't have permission to create new teams">
            <Button disabled testId="new-team-button">
              New team
            </Button>
          </Tooltip>
        )}
      </React.Fragment>
    );
  }

  renderLegacyWarning() {
    return (
      <React.Fragment>
        <Paragraph>
          Teams are available on our new platform plans, along with detailed usage insights, space
          environments, user management API and more.
        </Paragraph>

        {this.props.isAdmin ? (
          <React.Fragment>
            <ContactUsButton buttonType="link" />
            <Paragraph>Let us know if you’re interested in upgrading.</Paragraph>
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
      <div className="workbench" style={{ alignItems: 'center' }}>
        <WavyBackground preserveAspectRatio={'none'} style={{ height: 250, width: '100%' }} />
        <TeamsEmptyStateImage style={{ marginTop: -200 }} />
        <Heading element="h2" className="f36-margin-top--4xl f36-margin-bottom--m">
          Improved visibility with Teams
        </Heading>
        <Paragraph>Everyone in a Team can see other members of that Team.</Paragraph>

        {isLegacy ? this.renderLegacyWarning() : this.renderEmptyWarning()}

        <Paragraph className="f36-margin-top--4xl" style={{ opacity: 0.4 }}>
          Illustrations by <a href="#">Pablo Stanley</a>
        </Paragraph>
      </div>
    );
  }
}
