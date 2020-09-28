import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  Card,
  Button,
  DropdownList,
  DropdownListItem,
  Modal,
  Dropdown,
  Paragraph,
  Note,
} from '@contentful/forma-36-react-components';
import * as logger from 'services/logger';
import EnvironmentDetails from 'app/common/EnvironmentDetails';
import { handleChangeEnvironment } from './Utils';
import { aliasStyles } from './SharedStyles';
import { spacingM, spacingXs } from '@contentful/forma-36-tokens';
import {
  changeEnvironmentAbort,
  changeEnvironmentConfirm,
} from 'analytics/events/EnvironmentAliases';
import { CodeFragment } from 'ui/Content';
import AnimateHeight from 'react-animate-height';
import { triggerAliasChangedToast } from 'app/SpaceSettings/EnvironmentAliases/NotificationsService';

const changeEnvironmentModalStyles = {
  dropdown: css({
    width: '100%',
    height: '3.5rem',
  }),
  dropdownToggle: css({
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    '& > span': {
      display: 'flex',
      justifyContent: 'space-between',
    },
  }),
  list: css({
    padding: 0,
  }),
  dropdownContainer: css({
    zIndex: 1001,
  }),
  header: css({
    marginBottom: spacingM,
  }),
  subHeader: css({
    marginTop: spacingM,
  }),
  changeNotice: css({
    paddingTop: spacingXs,
    '& > span': {
      verticalAlign: 'middle',
    },
  }),
};

ChangeEnvironmentModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  spaceId: PropTypes.string.isRequired,
  setModalOpen: PropTypes.func.isRequired,
  alias: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.id,
    }),
  }),
  targetEnv: PropTypes.shape({
    aliases: PropTypes.arrayOf(PropTypes.string).isRequired,
    id: PropTypes.string.isRequired,
    payload: PropTypes.object.isRequired,
  }),
  environments: PropTypes.array.isRequired,
};

export default function ChangeEnvironmentModal({
  modalOpen,
  spaceId,
  setModalOpen,
  alias,
  targetEnv: { aliases, id: oldTarget, payload },
  environments,
}) {
  const initialAliasedEnvironment = 'Select environment';
  const [dropDownOpen, setDropDownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTarget, setNewTarget] = useState(initialAliasedEnvironment);

  useEffect(() => setNewTarget(initialAliasedEnvironment), [oldTarget]);

  const select = (aliasedEnvironment) => {
    setNewTarget(aliasedEnvironment);
    setDropDownOpen(false);
  };

  const changeEnvironment = async () => {
    setLoading(true);
    try {
      await triggerAliasChangedToast(handleChangeEnvironment, {
        spaceId,
        alias,
        oldTarget,
        newTarget,
      });
      changeEnvironmentConfirm();
      setModalOpen(false);
    } catch (err) {
      logger.logError('Aliases - changeEnvironment exception', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Change target environment of the ${alias.sys.id} alias`}
      onClose={() => {
        changeEnvironmentAbort();
        setNewTarget(initialAliasedEnvironment);
        setModalOpen(false);
      }}
      shouldCloseOnOverlayClick={false}
      size="large"
      isShown={modalOpen}
      testId="changeenvironmentmodal.modal">
      {({ title, onClose }) => (
        <React.Fragment>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content testId="changeenvironmentmodal.content">
            <Card className={aliasStyles.card}>
              <div className={aliasStyles.modalHeader}>
                <EnvironmentDetails
                  testId="changeenvironmentmodal.current-alias"
                  environmentId={alias.sys.id}
                  isMaster
                  isSelected
                  aliasId={alias.sys.id}
                  showAliasedTo={false}
                  hasCopy={false}
                />
              </div>
              <Paragraph>Current environment:</Paragraph>
              <Table className={aliasStyles.body}>
                <TableBody>
                  <TableRow className={aliasStyles.row}>
                    <TableCell>
                      <EnvironmentDetails
                        testId="changeenvironmentmodal.current-environment"
                        environmentId={oldTarget}
                        createdAt={payload.sys.createdAt}
                        isMaster={aliases.includes('master')}
                        hasCopy={false}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Paragraph className={changeEnvironmentModalStyles.subHeader}>Change to:</Paragraph>
              <Dropdown
                isOpen={dropDownOpen}
                className={changeEnvironmentModalStyles.dropdown}
                dropdownContainerClassName={changeEnvironmentModalStyles.dropdownContainer}
                toggleElement={
                  <Button
                    testId="changeenvironmentmodal.open-dropdown-btn"
                    className={changeEnvironmentModalStyles.dropdownToggle}
                    size="small"
                    buttonType="muted"
                    indicateDropdown
                    onClick={() => setDropDownOpen(!dropDownOpen)}>
                    {newTarget}
                  </Button>
                }>
                <DropdownList
                  testId="changeenvironmentmodal.dropdown"
                  maxHeight={150}
                  className={changeEnvironmentModalStyles.list}>
                  {environments
                    .filter(({ id }) => id !== oldTarget)
                    .map(({ id, payload }) => (
                      <DropdownListItem
                        testId={`changeenvironmentmodal.select-${id}`}
                        key={id}
                        isActive={newTarget === id}
                        onClick={() => select(id)}>
                        <EnvironmentDetails
                          hasCopy={false}
                          environmentId={id}
                          createdAt={payload.sys.createdAt}
                        />
                      </DropdownListItem>
                    ))}
                </DropdownList>
              </Dropdown>
            </Card>
            <AnimateHeight height={newTarget !== initialAliasedEnvironment ? 'auto' : 0}>
              <Note
                title={`The target environment of the ${alias.sys.id} alias will be changed from`}>
                <Paragraph className={changeEnvironmentModalStyles.changeNotice}>
                  <CodeFragment>{oldTarget}</CodeFragment>
                  <span>
                    <em> to </em>
                  </span>
                  <CodeFragment>{newTarget}</CodeFragment>
                </Paragraph>
              </Note>
            </AnimateHeight>
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="changeenvironmentmodal.accept-btn"
              onClick={changeEnvironment}
              buttonType="negative"
              loading={loading}
              disabled={newTarget === initialAliasedEnvironment}>
              Confirm changes
            </Button>
            <Button
              testId="changeenvironmentmodal.cancel-btn"
              onClick={onClose}
              buttonType="muted"
              disabled={loading}>
              Close
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
}
