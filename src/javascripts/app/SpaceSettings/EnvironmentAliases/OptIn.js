import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TextLink,
  Card,
  Button,
  Notification,
  Paragraph,
  ValidationMessage,
  TextInput,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import EnvironmentIcon from 'svg/environment.svg';
import * as logger from 'services/logger';
import EnvironmentDetails from 'app/common/EnvironmentDetails';
import StaticDropdown from './StaticDropdown';
import { handleOptIn, STEPS } from './Utils';
import { aliasStyles } from './SharedStyles';
import { optInAbortStep, optInComplete } from 'analytics/events/EnvironmentAliases';
import moment from 'moment';
import * as Navigator from 'states/Navigator';
import { validations } from '../Environments/CreateEnvDialogReducer';

const aliasOptInStyles = {
  buttons: css({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    '& > button': {
      marginTop: tokens.spacingS,
      alignItems: 'center',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
  }),
  backDrop: css({
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 20, 28, 0.5)',
    zIndex: 5,
  }),
  paragraph: css({
    marginBottom: tokens.spacingM,
    '& > code': {
      display: 'inline-block',
    },
  }),
  renameDropdownWithError: css({
    top: `${tokens.spacing3Xl} !important`,
  }),
};

export default function OptIn({ step, setStep, spaceId, testId }) {
  const [newEnvironmentId, setNewEnvironmentId] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEnvironmentId = () => {
    return validations['id'](newEnvironmentId) === undefined;
  };

  const optIn = async () => {
    setLoading(true);

    try {
      await handleOptIn(spaceId, newEnvironmentId);
      setStep(STEPS.THIRD_CHANGE_ENV);
      Notification.success('You have successfully opted-in');
    } catch (err) {
      logger.logError('Aliases - optIn exception', err);
      Notification.error('There was an error opting in - please try again');
    } finally {
      setLoading(false);
    }
  };

  const onOptInComplete = async () => {
    optInComplete();
    setTimeout(() => Navigator.reload());
  };

  const onReset = () => {
    optInAbortStep(step);
    setStep(STEPS.IDLE, false);
  };

  const reset = <TextLink onClick={onReset}>Cancel and exit setup</TextLink>;

  return (
    <Fragment>
      <Card className={aliasStyles.card} testId={testId}>
        <div className={aliasStyles.header}>
          <StaticDropdown
            isVisible={step === STEPS.FIRST_ALIAS}
            title="Your first environment alias"
            body={
              <div>
                <Paragraph className={aliasOptInStyles.paragraph}>
                  This is your first environment alias, the <strong>master</strong> alias.
                </Paragraph>
                <Paragraph className={aliasOptInStyles.paragraph}>
                  An alias allows you to access and modify the data of another environment, called
                  the target environment. In this case, the target environment of your master alias
                  will serve your production content.
                </Paragraph>
                <div className={aliasOptInStyles.buttons}>
                  <Button
                    testId="button.to-second-step"
                    buttonType="positive"
                    onClick={() => setStep(STEPS.SECOND_RENAMING)}>
                    Got it
                  </Button>
                  {reset}
                </div>
              </div>
            }>
            <EnvironmentDetails
              environmentId="master"
              showAliasedTo={false}
              aliasId="exists"
              isSelected
              isMaster
              hasCopy={false}></EnvironmentDetails>
          </StaticDropdown>
          <StaticDropdown
            isVisible={step === STEPS.THIRD_CHANGE_ENV}
            title="One last thing"
            align="right"
            body={
              <Fragment>
                You can change the target environment of the master alias here.
                <div className={aliasOptInStyles.buttons}>
                  <Button testId="button.finish" buttonType="positive" onClick={onOptInComplete}>
                    Got it
                  </Button>
                </div>
              </Fragment>
            }>
            <TextLink testId="openChangeDialog" disabled>
              Change target environment
            </TextLink>
          </StaticDropdown>
        </div>
        <Table className={aliasStyles.body}>
          <TableBody>
            <TableRow>
              <TableCell>
                <div className={aliasStyles.wrapper}>
                  {step === STEPS.THIRD_CHANGE_ENV ? (
                    <EnvironmentDetails
                      environmentId={newEnvironmentId}
                      isMaster></EnvironmentDetails>
                  ) : (
                    <Fragment>
                      <EnvironmentIcon className={aliasStyles.icon} />
                      <StaticDropdown
                        className={
                          newEnvironmentId && !isValidEnvironmentId()
                            ? aliasOptInStyles.renameDropdownWithError
                            : ''
                        }
                        isVisible={step === STEPS.SECOND_RENAMING}
                        title="Name your production environment"
                        body={
                          <Fragment>
                            <Paragraph className={aliasOptInStyles.paragraph}>
                              You need to rename your current master environment.
                            </Paragraph>
                            <Paragraph>
                              We recommend you choose a naming pattern that includes a version
                              counter or date:
                            </Paragraph>
                            <Paragraph className={aliasOptInStyles.paragraph}>
                              For example <code>prod-1</code> or
                              <code>master-{moment().format('YYYY-MM-DD')}</code>.
                            </Paragraph>
                            <Paragraph>
                              This helps you to keep track of the environment used in production –
                              similar to versioning code releases.
                            </Paragraph>
                            <div className={aliasOptInStyles.buttons}>
                              <Button
                                testId="button.to-third-step"
                                loading={loading}
                                disabled={
                                  !newEnvironmentId ||
                                  newEnvironmentId === 'master' ||
                                  !isValidEnvironmentId()
                                }
                                buttonType="positive"
                                onClick={optIn}>
                                Rename Environment
                              </Button>
                              {reset}
                            </div>
                          </Fragment>
                        }>
                        <TextInput
                          maxLength={40}
                          placeholder="master-YYYY-MM-DD"
                          testId="input"
                          value={newEnvironmentId}
                          onChange={({ target }) => setNewEnvironmentId(target.value)}
                        />

                        {newEnvironmentId && !isValidEnvironmentId() && (
                          <ValidationMessage>
                            {validations['id'](newEnvironmentId)}
                          </ValidationMessage>
                        )}
                      </StaticDropdown>
                    </Fragment>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
      <div className={aliasOptInStyles.backDrop}></div>
    </Fragment>
  );
}

OptIn.propTypes = {
  testId: PropTypes.string,
  step: PropTypes.number.isRequired,
  spaceId: PropTypes.string.isRequired,
  setStep: PropTypes.func.isRequired,
};

OptIn.defaultProps = {
  testId: 'optin.wrapper',
};
