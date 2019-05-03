import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Button,
  Icon,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = { icon: css({ verticalAlign: 'sub', marginRight: tokens.spacingXs }) };

class AddAssetButton extends React.Component {
  static propTypes = {
    canUploadMultipleAssets: PropTypes.func.isRequired,
    createMultipleAssets: PropTypes.func.isRequired,
    newAsset: PropTypes.func.isRequired
  };
  state = { isDropdownOpen: false };

  setOpen = isDropdownOpen => this.setState({ isDropdownOpen });
  addAssetButton = (
    <Button
      onClick={() => this.setOpen(!this.state.isDropdownOpen)}
      id="add-new-asset-button"
      aria-haspopup="true"
      aria-controls="new-asset-menu">
      <Icon color="white" icon="PlusCircle" className={styles.icon} />
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
          <DropdownListItem onClick={newAsset}>Single asset</DropdownListItem>
          {canUploadMultipleAssets() && (
            <DropdownListItem onClick={createMultipleAssets}>Multiple assets</DropdownListItem>
          )}
        </DropdownList>
      </Dropdown>
    );
  }
}

export default AddAssetButton;
