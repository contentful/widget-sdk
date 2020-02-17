import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import {
  Modal,
  Paragraph,
  TextLink,
  List,
  Typography,
  ListItem
} from '@contentful/forma-36-react-components';

import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { css } from 'emotion';

const styles = {
  listStyle: css({
    marginLeft: tokens.spacingL,
    listStyleType: 'disc'
  })
};

export default class SsoExemptionModal extends React.Component {
  static propTypes = {
    membership: OrganizationMembershipPropType.isRequired,
    onClose: PropTypes.func.isRequired,
    isShown: PropTypes.bool.isRequired
  };

  render() {
    const { membership, isShown, onClose } = this.props;
    const user = membership.sys.user;
    const exemptionReasonsMap = {
      userIsOwner: `The user is an owner of the organization`,
      userIsManuallyExempt: `The user is explicitly marked as exempt from Restricted Mode`,
      other: `Other`
    };

  

    return (
      <Modal isShown={isShown} onClose={onClose} title="SSO exemption">
        <Typography>
          <Paragraph>
            {`We can't enforce login via SSO on ${user.firstName ? user.firstName : user.email}`}.
          </Paragraph>
          <Paragraph>
            Users can continue logging into Contentful via email and third-party services even when{' '}
            <TextLink
              href="https://www.contentful.com/faq/sso/#how-does-sso-restricted-mode-work"
              rel="noopener noreferrer"
              target="_blank">
              Restricted Mode
            </TextLink>{' '}
            is enabled if they fall into one or more of the following conditions:
          </Paragraph>
          <List>
            {Object.keys(exemptionReasonsMap)
              .map(reason => (
                <ListItem key={reason} className={styles.listStyle}>
                  {exemptionReasonsMap[reason]}{' '}
                </ListItem>
              ))}
          </List>
          <Paragraph>
            <TextLink
              href="https://www.contentful.com/faq/sso/"
              rel="noopener noreferrer"
              target="_blank">
              Learn more about SSO in Contentful
            </TextLink>
          </Paragraph>
        </Typography>
      </Modal>
    );
  }
}
