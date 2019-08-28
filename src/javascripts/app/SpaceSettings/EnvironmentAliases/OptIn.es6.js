import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { css } from 'emotion';
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TextLink,
  Card,
  Button,
  TextInput,
  Notification
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import EnvironmentIcon from 'svg/environment.es6';
import * as logger from 'services/logger.es6';
import EnvironmentDetails from 'app/common/EnvironmentDetails.es6';
import StaticDropdown from './StaticDropdown.es6';
import { handleOptIn, STEPS } from './Utils.es6';
import { aliasStyles } from './SharedStyles.es6';

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
      justifyContent: 'center'
    }
  }),
  backDrop: css({
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 20, 28, 0.5)',
    zIndex: 5
  })
};

export default function OptIn({ step, setStep, spaceId, testId }) {
  const [newEnvironmentId, setNewEnvironmentId] = useState('');
  const [loading, setLoading] = useState(false);

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

  const onReset = () => setStep(STEPS.IDLE);
  const reset = <TextLink onClick={onReset}>Exit Alias Opt-in</TextLink>;

  return (
    <Fragment>
      <Card className={aliasStyles.card} testId={testId}>
        <div className={aliasStyles.header}>
          <StaticDropdown
            isVisible={step === STEPS.FIRST_ALIAS}
            title="1. Your first Alias"
            body={
              <Fragment>
                This is your first Alias, the Master Alias. An Alias points towards an Environment,
                in this case the Environment it points to will become your production Environment,
                but you can point it to any Environment you want.
                <div className={aliasOptInStyles.buttons}>
                  <Button
                    testId="button.to-second-step"
                    buttonType="positive"
                    onClick={() => setStep(STEPS.SECOND_RENAMING)}>
                    Got it
                  </Button>
                  {reset}
                </div>
              </Fragment>
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
            title="3. One last thing"
            align="right"
            body={
              <Fragment>
                You can change the environment your Master Alias points to here.
                <div className={aliasOptInStyles.buttons}>
                  <Button
                    testId="button.finish"
                    buttonType="positive"
                    onClick={() => setTimeout(() => window.location.reload())}>
                    Got it
                  </Button>
                </div>
              </Fragment>
            }>
            <TextLink testId="openChangeDialog" linkType="positive" disabled>
              Change Environment
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
                      createdAt={moment()}
                      isMaster></EnvironmentDetails>
                  ) : (
                    <Fragment>
                      <EnvironmentIcon className={aliasStyles.icon} />
                      <StaticDropdown
                        isVisible={step === STEPS.SECOND_RENAMING}
                        title="2. Your production Environment"
                        body={
                          <Fragment>
                            This was your master Environment, however to avoid confusion we ask you
                            to rename it. We recommend going with something like &quot;prod-1&quot;
                            or &quot;release-1&quot;, so that you can easily know which version
                            you&apos;re up to.
                            <div className={aliasOptInStyles.buttons}>
                              <Button
                                testId="button.to-third-step"
                                loading={loading}
                                disabled={!newEnvironmentId}
                                buttonType="positive"
                                onClick={optIn}>
                                Rename Environment
                              </Button>
                              {reset}
                            </div>
                          </Fragment>
                        }>
                        <TextInput
                          testId="input"
                          placeholder="release-1"
                          value={newEnvironmentId}
                          onChange={({ target }) => setNewEnvironmentId(target.value)}></TextInput>
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
  step: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
  setStep: PropTypes.func.isRequired
};

OptIn.defaultProps = {
  testId: 'optin.wrapper'
};
