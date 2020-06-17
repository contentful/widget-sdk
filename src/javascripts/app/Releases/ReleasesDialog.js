import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Button,
  Modal,
  FieldGroup,
  Form,
  FormLabel,
  TextInput,
  Tabs,
  Tab,
  TabPanel,
} from '@contentful/forma-36-react-components';
import { ReleasesContext } from './ReleasesWidget/ReleasesContext';

const styles = {
  noMarginBottom: css({
    marginBottom: 0,
  }),
  isVisible: css({
    display: 'block',
  }),
  tabs: css({
    display: 'flex',
  }),
  tab: css({
    alignItems: 'center',
    display: 'flex',
    textAlign: 'center',
    flexBasis: '100%',
    justifyContent: 'center',
    marginRight: 0,
  }),
  tabPanel: css({
    display: 'none',
    height: '100%',
    paddingTop: tokens.spacingM,
    overflowY: 'auto',
  }),
  form: css({
    '> div': {
      marginBottom: 0,
    },
  }),
  buttonRow: css({
    marginTop: tokens.spacingM,
  }),
};

const CreateReleaseForm = ({ onClose, onSubmit, buttonText }) => {
  const { dispatch } = useContext(ReleasesContext);
  const [releaseName, setReleaseName] = useState('');

  const onChange = (e) => {
    setReleaseName(e.target.value);
  };

  return (
    <Form
      spacing="condensed"
      className={styles.form}
      onSubmit={() => onSubmit(releaseName, dispatch)}>
      <FieldGroup row>
        <FormLabel htmlFor="releaseName" className={styles.noMarginBottom} required>
          Name the release
        </FormLabel>
      </FieldGroup>
      <FieldGroup row>
        <TextInput
          autoFocus
          id="releaseName"
          testId="release-name"
          isReadOnly={false}
          maxLength={256}
          name="releaseName"
          value={releaseName}
          onChange={onChange}
        />
      </FieldGroup>
      <FieldGroup row>
        <Button
          className={styles.buttonRow}
          buttonType="positive"
          type="submit"
          loading={false}
          disabled={!releaseName}
          testId="create-release">
          {buttonText}
        </Button>
        <Button
          className={styles.buttonRow}
          buttonType="muted"
          data-test-id="cancel"
          onClick={onClose}>
          Cancel
        </Button>
      </FieldGroup>
    </Form>
  );
};

CreateReleaseForm.propTypes = {
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  buttonText: PropTypes.string,
};

const ReleasesDialog = ({
  releaseContentTitle,
  tabs,
  defaultTab,
  contentStyle,
  title,
  onClose,
  showTabs,
}) => {
  const [selectedTab, setSelectedTab] = useState(defaultTab);

  const handleTabChange = (newTab) => {
    setSelectedTab(newTab);
  };

  return (
    <Modal
      title={title}
      size="small"
      shouldCloseOnEscapePress
      shouldCloseOnOverlayClick
      isShown
      testId="content-release-modal"
      onClose={onClose}>
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content className={contentStyle}>
            {releaseContentTitle && releaseContentTitle}
            {showTabs && (
              <Tabs className={styles.tabs} withDivider>
                {Object.keys(tabs).map((key) => (
                  <Tab
                    id={key}
                    key={key}
                    testId={`test-id-${key}`}
                    selected={selectedTab === key}
                    className={styles.tab}
                    onSelect={() => handleTabChange(key)}>
                    {tabs[key].title}
                  </Tab>
                ))}
              </Tabs>
            )}
            {Object.keys(tabs).map((key) => (
              <TabPanel
                id={key}
                key={key}
                className={cx(styles.tabPanel, {
                  [styles.isVisible]: selectedTab === key,
                })}>
                {tabs[key].render()}
              </TabPanel>
            ))}
          </Modal.Content>
        </>
      )}
    </Modal>
  );
};

ReleasesDialog.propTypes = {
  releaseContentTitle: PropTypes.object,
  tabs: PropTypes.object.isRequired,
  defaultTab: PropTypes.string.isRequired,
  contentStyle: PropTypes.string,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  showTabs: PropTypes.bool,
};

export { ReleasesDialog, CreateReleaseForm };
