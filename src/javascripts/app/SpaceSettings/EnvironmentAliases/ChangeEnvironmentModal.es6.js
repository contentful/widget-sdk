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
  Paragraph,
  Note
} from '@contentful/forma-36-react-components';
import * as logger from 'services/logger.es6';
import EnvironmentDetails from 'app/common/EnvironmentDetails.es6';
import { handleChangeEnvironment } from './Utils.es6';
import { aliasStyles } from './SharedStyles.es6';
import { spacingM, spacingXs } from '@contentful/forma-36-tokens';
import {
  changeEnvironmentAbort,
  changeEnvironmentConfirm
} from 'analytics/events/EnvironmentAliases.es6';
import { CodeFragment } from 'ui/Content.es6';
import AnimateHeight from 'react-animate-height';

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
  }),
  changeNotice: css({
    paddingTop: spacingXs,
    '& > span': {
      verticalAlign: 'middle'
    }
  })
};

ChangeEnvironmentModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  spaceId: PropTypes.string.isRequired,
  setModalOpen: PropTypes.func.isRequired,
  alias: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.id
    })
  }),
  targetEnv: PropTypes.shape({
    aliases: PropTypes.arrayOf(PropTypes.string).isRequired,
    id: PropTypes.string.isRequired,
    payload: PropTypes.object.isRequired
  }),
  environments: PropTypes.array.isRequired
};

export default function ChangeEnvironmentModal({
  modalOpen,
  spaceId,
  setModalOpen,
  alias,
  targetEnv: { aliases, id, payload },
  environments
}) {
  const initialAliasedEnvironment = 'Select environment';
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
        `Your "${alias.sys.id}" alias is now pointing towards the environment "${aliasedEnvironment}"`
      );
    } catch (err) {
      logger.logError('Aliases - changeEnvironment exception', err);
      Notification.error(
        `There was an error pointing your "${alias.sys.id}" alias towards the environment "${aliasedEnvironment}"`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Change target environment of the ${alias.sys.id} alias`}
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
            <Card className={aliasStyles.card}>
              <div className={changeEnvironmentModalStyles.header}>
                <EnvironmentDetails
                  testId="changeenvironmentmodal.current-alias"
                  environmentId={alias.sys.id}
                  isMaster
                  isSelected
                  aliasId={id}
                  showAliasedTo={false}
                  hasCopy={false}></EnvironmentDetails>
              </div>
              <Paragraph>Current environment:</Paragraph>
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
                    {aliasedEnvironment}
                  </Button>
                }>
                <DropdownList
                  testId="changeenvironmentmodal.dropdown"
                  maxHeight={150}
                  className={changeEnvironmentModalStyles.list}>
                  {environments
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
            <AnimateHeight height={aliasedEnvironment !== initialAliasedEnvironment ? 'auto' : 0}>
              <Note
                title={`The target environment of the ${alias.sys.id} alias will be changed from`}>
                <Paragraph className={changeEnvironmentModalStyles.changeNotice}>
                  <CodeFragment>{id}</CodeFragment>
                  <span>
                    <em> to </em>
                  </span>
                  <CodeFragment>{aliasedEnvironment}</CodeFragment>
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
