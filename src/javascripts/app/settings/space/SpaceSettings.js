import React from 'react';
import { connect } from 'react-redux';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import { Button, TextField, Form, Workbench } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import NavigationIcon from 'ui/Components/NavigationIcon';
import getOrgRole from 'redux/selectors/getOrgRole';

const styles = {
  deleteButton: css({
    marginRight: tokens.spacingM
  })
};

class SpaceSettings extends React.Component {
  static propTypes = {
    onRemoveClick: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
    spaceName: PropTypes.string.isRequired,
    spaceId: PropTypes.string.isRequired,

    showDeleteButton: PropTypes.bool.isRequired
  };

  state = {
    isSaving: false,
    initialSpaceName: this.props.spaceName,
    spaceName: this.props.spaceName
  };

  isSaveDisabled() {
    return !this.state.spaceName || this.state.spaceName === this.state.initialSpaceName;
  }

  onChangeSpaceName = e => {
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
          icon={<NavigationIcon icon="settings" color="green" size="large" />}
          actions={
            <>
              {showDeleteButton && (
                <Button
                  buttonType="negative"
                  onClick={onRemoveClick}
                  data-test-id="delete-space"
                  className={styles.deleteButton}>
                  Remove space and all its contents
                </Button>
              )}
              <Button
                disabled={this.isSaveDisabled()}
                onClick={this.onSaveNewName}
                buttonType="positive"
                loading={this.state.isSaving}
                data-test-id="update-space">
                Save
              </Button>
            </>
          }></Workbench.Header>
        <Workbench.Content type="text">
          <Form>
            <TextField
              name="space-id"
              id="space-id"
              labelText="Space ID:"
              testId="space-id-text-input"
              value={spaceId}
              textInputProps={{
                disabled: true
              }}
            />
            <TextField
              name="space-name"
              id="space-name"
              labelText="Space name:"
              testId="space-name-text-input"
              value={this.state.spaceName}
              onChange={this.onChangeSpaceName}
            />
          </Form>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default connect(state => ({
  showDeleteButton: ['owner', 'admin'].includes(getOrgRole(state))
}))(SpaceSettings);
