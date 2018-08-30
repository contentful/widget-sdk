import React from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/WorkbenchReact.es6';
import { Button, TextField } from '@contentful/ui-component-library';

export default class SpaceSettings extends React.Component {
  static propTypes = {
    openRemovalDialog: PropTypes.func.isRequired,
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
    if (!this.isSaveDisabled()) {
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
    }
  };

  renderContent() {
    return (
      <React.Fragment>
        <TextField
          name="space-id"
          id="space-id"
          labelText="Space ID:"
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
          value={this.state.spaceName}
          onChange={this.onChangeSpaceName}
        />
      </React.Fragment>
    );
  }

  renderActions() {
    return (
      <React.Fragment>
        <Button
          buttonType="negative"
          onClick={this.props.openRemovalDialog}
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
      </React.Fragment>
    );
  }

  render() {
    return (
      <Workbench
        centerContent
        title="Space settings"
        icon="page-settings"
        content={this.renderContent()}
        actions={this.renderActions()}
      />
    );
  }
}
