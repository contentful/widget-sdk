import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import { Button, TextField } from '@contentful/forma-36-react-components';
import getOrgRole from 'redux/selectors/getOrgRole.es6';

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
      <Workbench className="space-settings">
        <Workbench.Header>
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>Space settings</Workbench.Title>
          <Workbench.Header.Actions>
            {showDeleteButton && (
              <Button buttonType="negative" onClick={onRemoveClick} data-test-id="delete-space">
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
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content centered style={{ marginTop: 10 }}>
          <TextField
            name="space-id"
            id="space-id"
            labelText="Space ID:"
            testId="space-id-text-input"
            value={spaceId}
            textInputProps={{
              disabled: true
            }}
            style={{ marginBottom: 20 }}
          />
          <TextField
            name="space-name"
            id="space-name"
            labelText="Space name:"
            testId="space-name-text-input"
            value={this.state.spaceName}
            onChange={this.onChangeSpaceName}
          />
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default connect(state => ({
  showDeleteButton: ['owner', 'admin'].includes(getOrgRole(state))
}))(SpaceSettings);
