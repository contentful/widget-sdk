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
import { css } from 'emotion';
import * as Navigator from 'states/Navigator';
import { CodeFragment } from 'ui/Content';
import moment from 'moment';
import {
  notificationContinueOnEnvironment,
  notificationSwitchToAlias,
} from 'analytics/events/EnvironmentAliases';
import { ACTION } from './Utils';

const styles = {
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

const getTimestamp = () => moment().format('MMMM Do YYYY, h:mm:ss a');

const UpdateParagraph = ({ aliasId, oldTarget, newTarget }) => (
  <Paragraph
    className={
      styles.paragraph
    }>{`On ${getTimestamp()}, your space admin updated the ${aliasId} alias from ${oldTarget} to ${newTarget}.`}</Paragraph>
);

UpdateParagraph.propTypes = {
  aliasId: PropTypes.string.isRequired,
  newTarget: PropTypes.string.isRequired,
  oldTarget: PropTypes.string.isRequired,
};

export const AliasChangedChoiceModal = ({
  currentEnvironmentId,
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
    if (error) entityUnavailableNotification();
    setLoading(false);
    onClose();
  };

  const reloadToScopedRoute = () => {
    notificationSwitchToAlias();
    reloadTo(currentEnvironmentId);
  };
  const reloadToUnScopedRoute = () => {
    notificationContinueOnEnvironment();
    reloadTo(newTarget);
  };

  return (
    <Modal
      isShown={isShown}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      onClose={onClose}
      testId="aliaschangedchoicemodal.modal">
      {() => (
        <React.Fragment>
          <Modal.Header title="Your space admin has made changes to your space" />
          <Modal.Content>
            <UpdateParagraph aliasId={aliasId} oldTarget={oldTarget} newTarget={newTarget} />
            <Paragraph className={styles.paragraph}>
              {`This environment is no longer serving as ${aliasId}. Changes you’ve made on the current environment will stay with this environment, and may not be reflected as part of the ${aliasId} alias.`}
            </Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Tooltip
              className={styles.tooltip}
              targetWrapperClassName={styles.tooltip}
              content={`Changes will not be reflected as part of the ${aliasId} alias.`}>
              <Button
                testId="continueeditingonenvironment.button.aliaschangedchoicemodal.modal"
                buttonType="primary"
                onClick={reloadToScopedRoute}
                disabled={loading}>
                {`Continue editing on ${oldTarget}`}
              </Button>
            </Tooltip>
            <Tooltip
              className={styles.tooltip}
              targetWrapperClassName={styles.tooltip}
              content={`Changes you've made on the current environment (${currentEnvironmentId}) may not be reflected as part of the ${aliasId} alias.`}>
              <Button
                testId="switchtoaliasbutton.button.aliaschangedchoicemodal.modal"
                buttonType="naked"
                onClick={reloadToUnScopedRoute}
                disabled={loading}>
                {`Switch to ${aliasId}`}
              </Button>
            </Tooltip>
            {loading && <Spinner></Spinner>}
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
};

AliasChangedChoiceModal.propTypes = {
  currentEnvironmentId: PropTypes.string.isRequired,
  newTarget: PropTypes.string.isRequired,
  oldTarget: PropTypes.string.isRequired,
  aliasId: PropTypes.string.isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export const AliasChangedInfoModal = ({
  canManageEnvironments,
  oldTarget,
  newTarget,
  aliasId,
  isShown,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const reloadToUnScopedRoute = async () => {
    notificationSwitchToAlias();
    setLoading(true);
    const error = await Navigator.reloadWithEnvironment(newTarget);
    if (error) entityUnavailableNotification();
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isShown={isShown}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      onClose={onClose}
      testId="aliaschangedinfomodal.modal">
      {() => (
        <React.Fragment>
          <Modal.Header title="Your space admin has made changes to your space" />
          <Modal.Content>
            {canManageEnvironments ? (
              <Fragment>
                <UpdateParagraph aliasId={aliasId} oldTarget={oldTarget} newTarget={newTarget} />
                <Paragraph className={styles.paragraph}>
                  {`Any changes you’ve made will continue to be reflected on ${aliasId}.`}
                </Paragraph>
              </Fragment>
            ) : (
              <Fragment>
                <Paragraph className={styles.paragraph}>
                  {`You are now working on a different version of your space. Your work from ${getTimestamp()} has been saved, but is not available in this version.`}
                </Paragraph>
                <Paragraph className={styles.paragraph}>
                  If you have questions, contact your administrator.
                </Paragraph>
              </Fragment>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="continueediting.button.aliaschangedinfomodal.modal"
              buttonType="primary"
              onClick={reloadToUnScopedRoute}
              disabled={loading}
              loading={loading}>
              Continue editing
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
};

AliasChangedInfoModal.propTypes = {
  canManageEnvironments: PropTypes.bool.isRequired,
  newTarget: PropTypes.string.isRequired,
  oldTarget: PropTypes.string.isRequired,
  aliasId: PropTypes.string.isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

const UpdateCreateOrDeleteParagraph = ({ aliasId, target, action }) => (
  <Paragraph className={styles.paragraph}>
    {action === ACTION.CREATE
      ? `On ${getTimestamp()}, your space admin created the ${aliasId} alias on your current environment ${target}.`
      : `On ${getTimestamp()}, your space admin deleted the ${aliasId} alias on your current environment ${target}.`}
  </Paragraph>
);

UpdateCreateOrDeleteParagraph.propTypes = {
  target: PropTypes.string.isRequired,
  aliasId: PropTypes.string.isRequired,
  action: PropTypes.oneOf(['create', 'delete']).isRequired,
};

export const AliasCreatedOrDeletedInfoModal = ({
  canManageEnvironments,
  target,
  aliasId,
  isShown,
  action,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const reloadToUnScopedRoute = async () => {
    notificationSwitchToAlias();
    setLoading(true);
    const error = await Navigator.reloadWithEnvironment(target);
    if (error) entityUnavailableNotification();
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isShown={isShown}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      onClose={onClose}
      testId="aliascreatedordeletedinfomodal.modal">
      {() => (
        <React.Fragment>
          <Modal.Header title="Your space admin has made changes to your space" />
          <Modal.Content>
            {canManageEnvironments ? (
              <UpdateCreateOrDeleteParagraph aliasId={aliasId} target={target} action={action} />
            ) : (
              <Fragment>
                <Paragraph className={styles.paragraph}>
                  {`You are now working on a different version of your space. Your work from ${getTimestamp()} has been saved, but is not available in this version.`}
                </Paragraph>
                <Paragraph className={styles.paragraph}>
                  If you have questions, contact your administrator.
                </Paragraph>
              </Fragment>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="continueediting.button.aliascreatedordeletedinfomodal.modal"
              buttonType="primary"
              onClick={reloadToUnScopedRoute}
              disabled={loading}
              loading={loading}>
              Continue editing
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
};

AliasCreatedOrDeletedInfoModal.propTypes = {
  canManageEnvironments: PropTypes.bool.isRequired,
  target: PropTypes.string.isRequired,
  aliasId: PropTypes.string.isRequired,
  action: PropTypes.oneOf(['create', 'delete']).isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
