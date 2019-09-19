import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Button,
  ModalConfirm,
  Typography,
  Subheading,
  Paragraph,
  FieldGroup,
  RadioButtonField,
  Textarea,
  Note,
  List,
  ListItem
} from '@contentful/forma-36-react-components';
import { isEmpty, kebabCase } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { deleteUserAccount } from './AccountService.es6';

const styles = {
  dangerZoneNote: css({ marginTop: tokens.spacingXl }),
  orgName: css({
    fontWeight: tokens.fontWeightDemiBold,
    fontSize: tokens.fontSizeM,
    color: tokens.colorTextDark
  })
};

const DeleteUser = ({ userCancellationWarning }) => {
  const reasons = {
    otherSolution: { name: "I've found another solution", key: 'other_solution' },
    notUseful: { name: "I don't find it useful", key: 'not_useful' },
    dontUnderstand: { name: "I don't understand how to use it", key: 'dont_understand' },
    temporary: { name: "It's temporary. I'll be back", key: 'temporary' },
    other: { name: 'Other', key: 'other' }
  };
  const [showModal, setShowModal] = useState(false);
  const [activeOption, setActiveOption] = useState(reasons.other.key);
  const [details, setDetails] = useState('');

  const onCancelUser = ({ activeOption, details }) => {
    deleteUserAccount({ reason: activeOption, description: details });
  };

  return (
    <>
      <Heading>Danger Zone</Heading>
      <Button buttonType="negative" onClick={() => setShowModal(true)}>
        Delete User
      </Button>

      <ModalConfirm
        title="Danger Zone"
        intent="negative"
        shouldCloseOnEscapePress={true}
        shouldCloseOnOverlayClick={true}
        isShown={showModal}
        size="large"
        testId="dialog-user-cancellation"
        confirmTestId="confirm-user-cancellation"
        cancelTestId="cancel-user-cancellation"
        onCancel={() => {
          setShowModal(false);
        }}
        onConfirm={() => {
          setShowModal(false);
          onCancelUser({ activeOption, details });
        }}>
        <Typography>
          <Subheading>{"We're sorry to see you go."}</Subheading>
          <Paragraph>If there is anything we can help you with, please contact us.</Paragraph>
          <Subheading>{"What's your reason for cancelling?"}</Subheading>
          <FieldGroup>
            {Object.keys(reasons).map((reason, index) => (
              <RadioButtonField
                key={index}
                id={reasons[reason].key}
                labelText={reasons[reason].name}
                name={reasons[reason].key}
                checked={activeOption === reasons[reason].key}
                value={reasons[reason].key}
                onChange={e => {
                  setActiveOption(e.target.value);
                }}
              />
            ))}
          </FieldGroup>
          <Subheading>{'Do you mind giving us more details?'}</Subheading>
          <Textarea
            name="cancellationDetails"
            value={details}
            onChange={e => setDetails(e.target.value)}></Textarea>
        </Typography>
        {!isEmpty(userCancellationWarning.singleOwnerOrganizations) && (
          <Note className={styles.dangerZoneNote} noteType="negative">
            <Subheading>{"You're entering the danger zone!"}</Subheading>
            <Paragraph>
              The following organizations, including their spaces and all their content will be
              deleted permanently:
            </Paragraph>
            {userCancellationWarning.singleOwnerOrganizations.map(org => (
              <List key={`${kebabCase(org.name)}-list`}>
                <span key={kebabCase(org.name)} className={styles.orgName}>
                  {org.name}
                </span>{' '}
                (Organization)
                {org.spaceNames.map(name => (
                  <ListItem key={kebabCase(name)}>{name}</ListItem>
                ))}
              </List>
            ))}
          </Note>
        )}
      </ModalConfirm>
    </>
  );
};

DeleteUser.propTypes = {
  userCancellationWarning: PropTypes.any
};

export default DeleteUser;
