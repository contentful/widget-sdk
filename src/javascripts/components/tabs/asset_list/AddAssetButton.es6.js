import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';

class AddAssetButton extends React.Component {
  static propTypes = {
    canUploadMultipleAssets: PropTypes.func.isRequired,
    createMultipleAssets: PropTypes.func.isRequired,
    newAsset: PropTypes.func.isRequired,
    testId: PropTypes.string.isRequired,
    disabled: PropTypes.bool
  };
  state = { isDropdownOpen: false };

  setOpen = isDropdownOpen => this.setState({ isDropdownOpen });
  addAssetButton = (
    <Button
      onClick={() => this.setOpen(!this.state.isDropdownOpen)}
      testId={this.props.testId}
      disabled={this.props.disabled}
      id="add-new-asset-button"
      aria-haspopup="true"
      aria-controls="new-asset-menu">
      Add Asset
    </Button>
  );

  render() {
    const { isDropdownOpen } = this.state;
    const { canUploadMultipleAssets, createMultipleAssets, newAsset } = this.props;
    return (
      <Dropdown
        isOpen={isDropdownOpen}
        toggleElement={this.addAssetButton}
        onClose={() => this.setOpen(false)}
        id="new-asset-menu"
        role="menu"
        aria-labelledby="add-new-asset-button">
        <DropdownList>
          <DropdownListItem onClick={newAsset} testId="add-single-asset-button">
            Single asset
          </DropdownListItem>
          {canUploadMultipleAssets() && (
            <DropdownListItem onClick={createMultipleAssets} testId="add-multiple-assets-button">
              Multiple assets
            </DropdownListItem>
          )}
        </DropdownList>
      </Dropdown>
    );
  }
}

export default AddAssetButton;
