import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Note,
  Button,
  Modal,
  FieldGroup,
  Form,
  FormLabel,
  TextInput,
  Tabs,
  Tab,
  TabPanel,
  Notification,
} from '@contentful/forma-36-react-components';
import ReleasesTimeline from './ReleasesTimeline';
import { releases } from './__fixtures__';

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
};

export default class ReleasesDialog extends Component {
  constructor(props) {
    super(props);

    this.onClose = this.onClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onReleaseSelect = this.onReleaseSelect.bind(this);
  }

  static propTypes = {
    spaceId: PropTypes.string,
    environmentId: PropTypes.string,
    selectedEntities: PropTypes.array,
    validator: PropTypes.shape({
      run: PropTypes.func,
      setApiResponseErrors: PropTypes.func,
    }),
    onCreate: PropTypes.func,
    onCancel: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
    pendingReleases: PropTypes.array,
    isMasterEnvironment: PropTypes.bool,
    releaseContentTitle: PropTypes.string,
  };

  static defaultProps = {
    onCancel() {},
  };

  state = {
    selectedTab: 'existing',
    showError: false,
  };

  handleSubmit(e) {
    const releaseName = e.target.releaseName.value;
    const { releaseContentTitle } = this.props;

    if (!releaseName) {
      this.setState({ showError: true });
    } else {
      this.setState({ showError: false });
      this.onClose();
      Notification.success(
        `${releaseContentTitle} was sucessfully added to release the ${releaseName}`
      );
    }
  }

  handleTabChange(newTab) {
    this.setState({ selectedTab: newTab });
  }

  onClose() {
    this.props.onCancel();
  }

  onReleaseSelect(release) {
    const { releaseContentTitle } = this.props;

    this.onClose();
    Notification.success(
      `${releaseContentTitle} was sucessfully added to release the ${release.title}`
    );
  }

  tabs = {
    existing: {
      title: 'Add to existing',
      render: () => {
        return <ReleasesTimeline releases={releases} onReleaseSelect={this.onReleaseSelect} />;
      },
    },
    new: {
      title: '+ Create new',
      render: () => {
        return (
          <Form spacing="condensed" className={styles.form} onSubmit={this.handleSubmit}>
            <FieldGroup row>
              <FormLabel htmlFor="releaseName" className={styles.noMarginBottom} required>
                Name the release
              </FormLabel>
            </FieldGroup>
            <FieldGroup row>
              <TextInput
                autoFocus
                id="releaseName"
                isReadOnly={false}
                maxLength={256}
                name="releaseName"
              />
            </FieldGroup>
            {this.state.showError && (
              <FieldGroup row>
                <Note noteType="negative">The release name should not be empty.</Note>
              </FieldGroup>
            )}
            <FieldGroup row>
              <Button buttonType="positive" type="submit" loading={false} disabled={false}>
                Create and Add
              </Button>
              <Button buttonType="muted" data-test-id="cancel" onClick={this.onClose}>
                Cancel
              </Button>
            </FieldGroup>
          </Form>
        );
      },
    },
  };

  render() {
    const { releaseContentTitle } = this.props;

    return (
      <Modal
        title="Add to a Content Release"
        size="small"
        shouldCloseOnEscapePress
        shouldCloseOnOverlayClick
        isShown
        testId="content-release-modal"
        onClose={this.onClose}>
        {({ title, onClose }) => (
          <>
            <Modal.Header title={title} onClose={onClose} />
            <Modal.Content>
              Add <b>&apos;{releaseContentTitle}&apos;</b> into a content release:
              <Tabs className={styles.tabs} withDivider>
                {Object.keys(this.tabs).map((key) => (
                  <Tab
                    id={key}
                    key={key}
                    testId={`test-id-${key}`}
                    selected={this.state.selectedTab === key}
                    className={styles.tab}
                    onSelect={() => this.handleTabChange(key)}>
                    {this.tabs[key].title}
                  </Tab>
                ))}
              </Tabs>
              {Object.keys(this.tabs).map((key) => (
                <TabPanel
                  id={key}
                  key={key}
                  className={cx(styles.tabPanel, {
                    [styles.isVisible]: this.state.selectedTab === key,
                  })}>
                  {this.tabs[key].render()}
                </TabPanel>
              ))}
            </Modal.Content>
          </>
        )}
      </Modal>
    );
  }
}
