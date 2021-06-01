import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  Paragraph,
  Notification,
  Spinner,
  Tooltip,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel';
import { css } from 'emotion';
import * as Navigator from 'states/Navigator';
import { CodeFragment } from 'ui/Content';

const styles = {
  aliasInfo: {
    container: css({
      marginTop: tokens.spacingM,
      width: '100%',
      gridGap: 10,
      display: 'grid',
      gridTemplateColumns: '100px auto',
      gridTemplateAreas: '"left right"',
    }),
    left: css({ gridArea: 'left' }),
    right: css({ gridArea: 'right' }),
  },
  paragraph: css({
    marginTop: tokens.spacingXs,
  }),
  flex: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  notification: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    whiteSpace: 'pre',
  }),
  tooltip: css({
    zIndex: 1000,
  }),
  buttonEnvCodeStyle: css({ fontWeight: tokens.fontWeightDemiBold }),
  envCodeStyle: css({ color: tokens.colorTextDark, fontWeight: tokens.fontWeightDemiBold }),
  oldAliasTextStyle: css({ textDecoration: 'line-through' }),
};

export const entityUnavailableNotification = () =>
  Notification.warning('The entity you worked on is no longer available.', { duration: 60000 });

export const FromTo = ({ message, oldTarget, newTarget }) => (
  <Paragraph className={styles.notification}>
    <span>{message}</span>
    <CodeFragment>{oldTarget}</CodeFragment>
    <em> to </em>
    <CodeFragment>{newTarget}</CodeFragment>.
  </Paragraph>
);

FromTo.propTypes = {
  newTarget: PropTypes.string.isRequired,
  oldTarget: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
};

export const Message = ({ message }) => (
  <Paragraph className={styles.notification}>
    <span>{message}</span>
  </Paragraph>
);

Message.propTypes = {
  message: PropTypes.string.isRequired,
};

export const AliasChangedChoiceModal = ({
  currentEnvironmentId,
  newTargetIsMaster,
  oldTarget,
  newTarget,
  aliasId,
  isShown,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const reloadTo = async (newEnvironmentId) => {
    setLoading(true);
    const error = await Navigator.reloadWithEnvironment(newEnvironmentId);
    if (error) {
      entityUnavailableNotification();
    }
    setLoading(false);
    onClose();
  };

  const reload = async () => {
    setLoading(true);
    await Navigator.reload();
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      size="large"
      isShown={isShown}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      onClose={onClose}
      testId="aliaschangedchoicemodal.modal">
      {() => (
        <React.Fragment>
          <Modal.Header title="Environment alias target changed" />
          <Modal.Content>
            <>
              {newTargetIsMaster ? (
                <>
                  <Paragraph className={styles.paragraph}>
                    The <code className={styles.envCodeStyle}>{aliasId}</code> alias you are working
                    in is now pointing to the{' '}
                    <code className={styles.envCodeStyle}>{newTarget}</code> environment, which is
                    also targeted by the <code className={styles.envCodeStyle}>master</code> alias.
                  </Paragraph>
                  <Paragraph className={styles.paragraph}>
                    If you continue working on{' '}
                    <code className={styles.envCodeStyle}>{aliasId}</code>, the changes will also be
                    reflected by the <code className={styles.envCodeStyle}>master</code> alias
                  </Paragraph>
                </>
              ) : (
                <Paragraph>
                  The <code className={styles.envCodeStyle}>{aliasId}</code> alias you are working
                  in is now pointing to the <code className={styles.envCodeStyle}>{newTarget}</code>{' '}
                  environment.
                </Paragraph>
              )}
              <div className={styles.aliasInfo.container}>
                <div className={styles.aliasInfo.left}>
                  <div>Previously:</div>
                  <div>Now:</div>
                </div>
                <div className={styles.aliasInfo.right}>
                  <div>
                    <EnvOrAliasLabel
                      aliasId={aliasId}
                      className={styles.oldAliasTextStyle}
                      environmentId={oldTarget}
                    />
                  </div>
                  <div>
                    <EnvOrAliasLabel
                      aliasId={aliasId}
                      environmentId={newTarget}
                      overrideColor={tokens.colorTextDark}
                    />
                  </div>
                </div>
              </div>
            </>
          </Modal.Content>
          <Modal.Controls>
            <Tooltip
              className={styles.tooltip}
              targetWrapperClassName={styles.tooltip}
              content={`Changes you've made on the current environment (${currentEnvironmentId}) may not be reflected as part of the ${aliasId} alias.`}>
              <Button
                testId="switchtoaliasbutton.button.aliaschangedchoicemodal.modal"
                buttonType="primary"
                onClick={reload}
                disabled={loading}>
                Continue on <code className={styles.buttonEnvCodeStyle}>{aliasId}</code>
              </Button>
            </Tooltip>
            <Tooltip
              className={styles.tooltip}
              targetWrapperClassName={styles.tooltip}
              content={`Changes will not be reflected as part of the ${aliasId} alias.`}>
              <Button
                testId="continueeditingonenvironment.button.aliaschangedchoicemodal.modal"
                buttonType="naked"
                onClick={() => reloadTo(oldTarget)}
                disabled={loading}>
                Move to <code className={styles.envCodeStyle}>{oldTarget}</code>
              </Button>
            </Tooltip>
            {loading && <Spinner />}
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
};

AliasChangedChoiceModal.propTypes = {
  currentEnvironmentId: PropTypes.string.isRequired,
  newTarget: PropTypes.string.isRequired,
  newTargetIsMaster: PropTypes.bool.isRequired,
  oldTarget: PropTypes.string.isRequired,
  aliasId: PropTypes.string.isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export const AliasChangedInfoModal = ({ isShown, onClose }) => {
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    await Navigator.reloadWithEnvironment('master');
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      size="large"
      isShown={isShown}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      onClose={onClose}
      testId="aliaschangedinfomodal.modal">
      {() => (
        <React.Fragment>
          <Modal.Header title="Your space admin has made changes to your space" />
          <Modal.Content>
            <Fragment>
              <Paragraph className={styles.paragraph}>
                You are now working on a different version of your space. Your recent work is not
                available in this version.
              </Paragraph>
              <Paragraph className={styles.paragraph}>
                Reach out to your space admin if you have any questions
              </Paragraph>
            </Fragment>
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="continueediting.button.aliaschangedinfomodal.modal"
              buttonType="primary"
              onClick={reload}
              disabled={loading}
              loading={loading}>
              {`Continue`}
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
};

AliasChangedInfoModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export const MasterAliasMovedModal = ({ isMaster, isShown, onClose }) => {
  return (
    <Modal
      size="large"
      isShown={isShown}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      onClose={onClose}
      testId="masteraliasmovedmodal.modal">
      {() => (
        <React.Fragment>
          <Modal.Header title="Environment alias target changed" />
          <Modal.Content>
            <Fragment>
              <Paragraph className={styles.paragraph}>
                This environment is {isMaster ? 'now' : 'no longer'} targeted by the{' '}
                <code className={styles.envCodeStyle}>master</code> alias.
              </Paragraph>
              <Paragraph className={styles.paragraph}>
                Reach out to your space admin if you have any questions.
              </Paragraph>
            </Fragment>
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="continueediting.button.masteraliasmovedmodal.modal"
              buttonType="primary"
              onClick={onClose}>
              {`Continue`}
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
};

MasterAliasMovedModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isMaster: PropTypes.bool.isRequired,
};

export const AliasDeletedInfoModal = ({ target, aliasId, isShown, onClose }) => {
  const [loading, setLoading] = useState(false);

  const reloadTo = async (newEnvironmentId) => {
    setLoading(true);
    const error = await Navigator.reloadWithEnvironment(newEnvironmentId);
    if (error) {
      entityUnavailableNotification();
    }
    setLoading(false);
    onClose();
  };

  const reloadToUnScopedRoute = async () => {
    setLoading(true);
    await Navigator.reloadWithEnvironment('master');
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      size="large"
      isShown={isShown}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      onClose={onClose}
      testId="aliasdeletedinfomodal.modal">
      {() => (
        <React.Fragment>
          <Modal.Header title="Environment alias deleted" />
          <Modal.Content>
            <Paragraph className={styles.paragraph}>
              Your space admin deleted the <code className={styles.envCodeStyle}>{aliasId}</code>{' '}
              alias you were working in.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              No reason to worry, you can continue work on the{' '}
              <code className={styles.envCodeStyle}>{target}</code> environment it was pointing to
              or move to the <code className={styles.envCodeStyle}>master</code> alias.
            </Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Tooltip
              className={styles.tooltip}
              targetWrapperClassName={styles.tooltip}
              content={`Changes you've made on the current environment (${target}) are still available there.`}>
              <Button
                testId="continueediting.button.aliasdeletedinfomodal.modal"
                buttonType="primary"
                onClick={() => reloadTo(target)}
                disabled={loading}
                loading={loading}>
                Continue on <code className={styles.buttonEnvCodeStyle}>{target}</code>
              </Button>
            </Tooltip>
            <Tooltip
              className={styles.tooltip}
              targetWrapperClassName={styles.tooltip}
              content={`Go to master.`}>
              <Button
                testId="continueeditingonenvironment.button.aliasdeletedchoicemodal.modal"
                buttonType="naked"
                onClick={reloadToUnScopedRoute}
                disabled={loading}>
                Move to <code className={styles.envCodeStyle}>master</code>
              </Button>
            </Tooltip>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
};

AliasDeletedInfoModal.propTypes = {
  target: PropTypes.string.isRequired,
  aliasId: PropTypes.string.isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
