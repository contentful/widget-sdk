import React from 'react';
import { connect } from 'react-redux';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import {
  Button,
  TextField,
  Workbench,
  Card,
  Typography,
  Heading,
  Paragraph,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import NavigationIcon from 'ui/Components/NavigationIcon';
import getOrgRole from 'redux/selectors/getOrgRole';

const styles = {
  section: css({
    maxWidth: '768px',
    margin: `${tokens.spacingL} auto`,
    padding: tokens.spacingXl,
  }),
  saveButton: css({
    marginLeft: '16px',
    overflow: 'visible',
  }),
  renameSpaceContainer: css({
    display: 'flex',
    marginTop: '1rem',
    alignItems: 'flex-end',
  }),
};

class SpaceSettings extends React.Component {
  state = {
    isSaving: false,
    initialSpaceName: this.props.spaceName,
    spaceName: this.props.spaceName,
  };

  isSaveDisabled() {
    return !this.state.spaceName || this.state.spaceName === this.state.initialSpaceName;
  }

  onChangeSpaceName = (e) => {
    this.setState({ spaceName: e.target.value });
  };

  onSaveNewName = () => {
    const newSpaceName = this.state.spaceName;
    this.setState({ isSaving: true });
    this.props
      .save(newSpaceName)
      .then(() => {
        this.setState({ isSaving: false, initialSpaceName: newSpaceName });
      })
      .catch(() => {
        this.setState({ isSaving: false });
      });
  };

  render() {
    const { showDeleteButton, onRemoveClick, spaceId } = this.props;
    return (
      <Workbench>
        <Workbench.Header
          title="Space settings"
          icon={<NavigationIcon icon="settings" color="green" size="large" />}></Workbench.Header>
        <Workbench.Content type="text">
          <Card className={styles.section}>
            <Typography>
              <Heading>General</Heading>
              <TextField
                name="space-id"
                id="space-id"
                labelText="Space ID:"
                testId="space-id-text-input"
                value={spaceId}
                textInputProps={{
                  disabled: true,
                  withCopyButton: true,
                }}
              />
              <div className={styles.renameSpaceContainer}>
                <TextField
                  name="space-name"
                  id="space-name"
                  labelText="Space name:"
                  testId="space-name-text-input"
                  value={this.state.spaceName}
                  onChange={this.onChangeSpaceName}
                />
                <Button
                  disabled={this.isSaveDisabled()}
                  onClick={this.onSaveNewName}
                  buttonType="positive"
                  loading={this.state.isSaving}
                  className={styles.saveButton}
                  data-test-id="update-space">
                  Rename space
                </Button>
              </div>
            </Typography>
          </Card>
          {showDeleteButton && (
            <Card testId="danger-zone-section-card" className={styles.section}>
              <Typography>
                <Heading>Danger zone</Heading>
                <Paragraph>
                  Once you delete this space, all of its contents and the space itself will be
                  removed.
                </Paragraph>

                <Button buttonType="negative" onClick={onRemoveClick} data-test-id="delete-space">
                  Delete space and all its contents
                </Button>
              </Typography>
            </Card>
          )}
        </Workbench.Content>
      </Workbench>
    );
  }
}

SpaceSettings.propTypes = {
  onRemoveClick: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  spaceName: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
  showDeleteButton: PropTypes.bool.isRequired,
};

export const SpaceSettingsConnected = connect((state) => ({
  showDeleteButton: ['owner', 'admin'].includes(getOrgRole(state)),
}))(SpaceSettings);
