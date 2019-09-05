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
  Notification,
  Paragraph
} from '@contentful/forma-36-react-components';
import * as logger from 'services/logger.es6';
import EnvironmentDetails from 'app/common/EnvironmentDetails.es6';
import { handleChangeEnvironment } from './Utils.es6';
import { aliasStyles } from './SharedStyles.es6';
import { spacingM } from '@contentful/forma-36-tokens';
import {
  changeEnvironmentAbort,
  changeEnvironmentConfirm
} from 'analytics/events/EnvironmentAliases.es6';

const changeEnvironmentModalStyles = {
  dropdown: css({
    width: '100%',
    height: '3.5rem'
  }),
  dropdownToggle: css({
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    '& > span': {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }),
  list: css({
    padding: 0
  }),
  dropdownContainer: css({
    zIndex: 1001
  }),
  header: css({
    marginBottom: spacingM
  }),
  subHeader: css({
    marginTop: spacingM
  })
};

ChangeEnvironmentModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  spaceId: PropTypes.string.isRequired,
  setModalOpen: PropTypes.func.isRequired,
  aliases: PropTypes.arrayOf(PropTypes.string).isRequired,
  id: PropTypes.string.isRequired,
  payload: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired
};

export default function ChangeEnvironmentModal({
  modalOpen,
  spaceId,
  setModalOpen,
  aliases,
  id,
  payload,
  items
}) {
  const initialAliasedEnvironment = 'Select environment';
  const [alias] = aliases;
  const [dropDownOpen, setDropDownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aliasedEnvironment, setAliasedEnvironment] = useState(initialAliasedEnvironment);

  useEffect(() => setAliasedEnvironment(initialAliasedEnvironment), [id]);

  const select = aliasedEnvironment => {
    setAliasedEnvironment(aliasedEnvironment);
    setDropDownOpen(false);
  };

  const changeEnvironment = async () => {
    setLoading(true);
    try {
      await handleChangeEnvironment(spaceId, alias, aliasedEnvironment);
      changeEnvironmentConfirm();
      setModalOpen(false);
      setTimeout(() => window.location.reload(), 1000);
      Notification.success(
        `Your "${alias}" Alias is now pointing towards the environment "${aliasedEnvironment}"`
      );
    } catch (err) {
      logger.logError('Aliases - changeEnvironment exception', err);
      Notification.error(
        `There was an error pointing your "${alias}" Alias towards the environment "${aliasedEnvironment}"`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Point Master Alias to another Environment"
      onClose={() => {
        changeEnvironmentAbort();
        setAliasedEnvironment(initialAliasedEnvironment);
        setModalOpen(false);
      }}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}
      size="large"
      isShown={modalOpen}
      testId="changeenvironmentmodal.modal">
      {({ title, onClose }) => (
        <React.Fragment>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content testId="changeenvironmentmodal.content">
            <Paragraph>{`Select the new environment you would like your "${alias}" Alias to point to:`}</Paragraph>
            <Card className={aliasStyles.card}>
              <div className={changeEnvironmentModalStyles.header}>
                <EnvironmentDetails
                  testId="changeenvironmentmodal.current-alias"
                  environmentId={aliases[0]}
                  isMaster
                  isSelected
                  aliasId={id}
                  showAliasedTo={false}
                  hasCopy={false}></EnvironmentDetails>
              </div>
              <Paragraph>Current Environment:</Paragraph>
              <Table className={aliasStyles.body}>
                <TableBody>
                  <TableRow className={aliasStyles.row}>
                    <TableCell>
                      <EnvironmentDetails
                        testId="changeenvironmentmodal.current-environment"
                        environmentId={id}
                        createdAt={payload.sys.createdAt}
                        isMaster={aliases.includes('master')}
                        hasCopy={false}></EnvironmentDetails>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Paragraph className={changeEnvironmentModalStyles.subHeader}>Switch to:</Paragraph>
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
                    {aliasedEnvironment}
                  </Button>
                }>
                <DropdownList
                  testId="changeenvironmentmodal.dropdown"
                  maxHeight={150}
                  className={changeEnvironmentModalStyles.list}>
                  {items
                    .filter(({ aliases }) => aliases.length <= 0)
                    .map(({ id, payload }) => (
                      <DropdownListItem
                        testId={`changeenvironmentmodal.select-${id}`}
                        key={id}
                        isActive={aliasedEnvironment === id}
                        onClick={() => select(id)}>
                        <EnvironmentDetails
                          hasCopy={false}
                          environmentId={id}
                          createdAt={payload.sys.createdAt}></EnvironmentDetails>
                      </DropdownListItem>
                    ))}
                </DropdownList>
              </Dropdown>
            </Card>
            {aliasedEnvironment !== initialAliasedEnvironment && (
              <Paragraph>
                {`The environment serving production content will be changed to "${aliasedEnvironment}"!`}
              </Paragraph>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="changeenvironmentmodal.accept-btn"
              onClick={changeEnvironment}
              buttonType="negative"
              loading={loading}
              disabled={aliasedEnvironment === initialAliasedEnvironment}>
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
