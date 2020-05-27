import React, { Component, useState, useContext } from 'react';
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
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import ReleasesTimeline from './ReleasesTimeline';
import {
  createRelease,
  getReleasesExcludingEntity,
  getReleasesIncludingEntity,
} from './releasesService';
import { ReleasesProvider, ReleasesContext } from './ReleasesContext';
import { SET_RELEASES_INCLUDING_ENTRY } from './state/actions';

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

const CreateReleaseForm = ({ onClose, handleCreateRelease, rootEntity }) => {
  const { dispatch } = useContext(ReleasesContext);
  const [releaseName, setReleaseName] = useState('');

  const onSubmit = () => {
    if (releaseName) {
      handleCreateRelease(releaseName).then(async () => {
        const { id, type } = rootEntity.sys;
        const fetchedReleases = await getReleasesIncludingEntity(id, type);

        dispatch({ type: SET_RELEASES_INCLUDING_ENTRY, value: fetchedReleases.items });

        onClose();
      });
    }
  };

  const onChange = (e) => {
    setReleaseName(e.target.value);
  };

  return (
    <Form spacing="condensed" className={styles.form} onSubmit={onSubmit}>
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
          value={releaseName}
          onChange={onChange}
        />
      </FieldGroup>
      <FieldGroup row>
        <Button buttonType="positive" type="submit" loading={false} disabled={!releaseName}>
          Create and Add
        </Button>
        <Button buttonType="muted" data-test-id="cancel" onClick={onClose}>
          Cancel
        </Button>
      </FieldGroup>
    </Form>
  );
};

CreateReleaseForm.propTypes = {
  onClose: PropTypes.func,
  handleCreateRelease: PropTypes.func,
  rootEntity: PropTypes.object,
};

export default class ReleasesDialog extends Component {
  constructor(props) {
    super(props);

    this.onClose = this.onClose.bind(this);
    this.onReleaseSelect = this.onReleaseSelect.bind(this);
    this.handleCreateRelease = this.handleCreateRelease.bind(this);
  }

  static propTypes = {
    spaceId: PropTypes.string,
    environmentId: PropTypes.string,
    selectedEntities: PropTypes.array,
    rootEntity: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string,
        type: PropTypes.string,
      }),
    }).isRequired,
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
    fetchedReleases: [],
  };

  async componentDidMount() {
    const { id, type } = this.props.rootEntity.sys;
    const fetchedReleases = await getReleasesExcludingEntity(id, type);
    this.setState({ fetchedReleases: fetchedReleases.items });
  }

  handleCreateRelease(releaseName) {
    const { releaseContentTitle, selectedEntities } = this.props;

    return createRelease(releaseName, selectedEntities)
      .then(() => {
        Notification.success(`${releaseContentTitle} was sucessfully added to ${releaseName}`);
      })
      .catch(() => {
        Notification.error(`Failed creating ${releaseName}`);
      });
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
    Notification.success(`${releaseContentTitle} was sucessfully added to ${release.title}`);
  }

  tabs = {
    existing: {
      title: 'Add to existing',
      render: () => {
        if (this.state.fetchedReleases.length) {
          return (
            <ReleasesTimeline
              releases={this.state.fetchedReleases}
              onReleaseSelect={this.onReleaseSelect}
            />
          );
        }
        return (
          <SkeletonContainer svgHeight={60}>
            <SkeletonBodyText numberOfLines={1} />
            <SkeletonBodyText numberOfLines={1} offsetTop={20} />
            <SkeletonBodyText numberOfLines={1} offsetTop={40} />
          </SkeletonContainer>
        );
      },
    },
    new: {
      title: '+ Create new',
      render: () => {
        return (
          <ReleasesProvider>
            <CreateReleaseForm
              onClose={this.onClose}
              handleCreateRelease={this.handleCreateRelease}
              rootEntity={this.props.rootEntity}
            />
          </ReleasesProvider>
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
