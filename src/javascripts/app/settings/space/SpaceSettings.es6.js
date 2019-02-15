import React from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import { Button, TextField } from '@contentful/forma-36-react-components';

export default class SpaceSettings extends React.Component {
  static propTypes = {
    onRemoveClick: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
    spaceName: PropTypes.string.isRequired,
    spaceId: PropTypes.string.isRequired
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
    return (
      <Workbench className="space-settings">
        <Workbench.Header>
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>Space settings</Workbench.Title>
          <Workbench.Header.Actions>
            <Button
              buttonType="negative"
              onClick={this.props.onRemoveClick}
              data-test-id="delete-space">
              Remove space and all its contents
            </Button>
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
            value={this.props.spaceId}
            textInputProps={{
              disabled: true
            }}
            style={{ marginBottom: 20 }}
          />
          <TextField
            name="space-name"
            id="space-name"
            labelText="Space name:"
            testId='space-name-text-input'
            value={this.state.spaceName}
            onChange={this.onChangeSpaceName}
          />
        </Workbench.Content>
      </Workbench>
    );
  }
}
