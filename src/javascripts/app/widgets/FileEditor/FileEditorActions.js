import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import mimetype from '@contentful/mimetype';
import * as AssetUrlService from 'services/AssetUrlService';
import {
  Tooltip,
  Button,
  Icon,
  Dropdown,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';

const styles = {
  root: css({
    marginTop: tokens.spacingM,
    'button, a': {
      marginRight: tokens.spacingM,
    },
  }),
  buttonIcon: css({
    marginTop: '8px',
  }),
};

function DownloadButton(props) {
  const href = AssetUrlService.transformHostname(props.file.url);
  return (
    <Tooltip content="Download file" disabled={props.disabled}>
      <Button
        buttonType="muted"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        disabled={props.disabled}>
        <Icon icon="Download" color="secondary" className={styles.buttonIcon} />
      </Button>
    </Tooltip>
  );
}

function ShowMetaButton(props) {
  return (
    <Tooltip content="Show file information">
      <Button buttonType="muted" onClick={props.onToggleMeta} disabled={props.disabled}>
        <Icon icon="InfoCircle" color="secondary" className={styles.buttonIcon} />
      </Button>
    </Tooltip>
  );
}

function DeleteButton(props) {
  return (
    <Tooltip content="Delete file">
      <Button buttonType="muted" onClick={props.onDelete} disabled={props.disabled}>
        <Icon icon="Delete" color="secondary" className={styles.buttonIcon} />
      </Button>
    </Tooltip>
  );
}

function RotateButton(props) {
  const [showDropdown, setShow] = useState(false);

  const action = (mode) => () => {
    setShow(false);
    props.onRotate(mode);
  };

  return (
    <Dropdown
      position="bottom-left"
      isOpen={showDropdown}
      onClose={() => {
        setShow(false);
      }}
      toggleElement={
        <Tooltip content="Rotate or mirror image">
          <Button
            disabled={props.disabled}
            buttonType="muted"
            onClick={() => {
              setShow(!showDropdown);
            }}>
            <i className="fa fa-undo" />
          </Button>
        </Tooltip>
      }>
      <DropdownList>
        <DropdownListItem onClick={action('90cw')}>Rotate 90° clockwise</DropdownListItem>
        <DropdownListItem onClick={action('90ccw')}>Rotate 90° counterclockwise</DropdownListItem>
        <DropdownListItem onClick={action('flip')}>Mirror vertically</DropdownListItem>
        <DropdownListItem onClick={action('flop')}>Mirror horizontally</DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
}

function ResizeButton(props) {
  const [showDropdown, setShow] = useState(false);

  const action = (mode) => () => {
    setShow(false);
    props.onResize(mode);
  };

  return (
    <Dropdown
      position="bottom-left"
      isOpen={showDropdown}
      onClose={() => {
        setShow(false);
      }}
      toggleElement={
        <Tooltip content="Resize image">
          <Button
            disabled={props.disabled}
            buttonType="muted"
            onClick={() => {
              setShow(!showDropdown);
            }}>
            <i className="fa fa-compress" />
          </Button>
        </Tooltip>
      }>
      <DropdownList>
        <DropdownListItem onClick={action('width')}>Select width</DropdownListItem>
        <DropdownListItem onClick={action('height')}>Select height</DropdownListItem>
        <DropdownListItem onClick={action('scale')}>Scale</DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
}

function CropButton(props) {
  const [showDropdown, setShow] = useState(false);

  const action = (mode) => () => {
    setShow(false);
    props.onCrop(mode);
  };

  return (
    <Dropdown
      position="bottom-left"
      isOpen={showDropdown}
      onClose={() => {
        setShow(false);
      }}
      toggleElement={
        <Tooltip content="Crop image">
          <Button
            disabled={props.disabled}
            buttonType="muted"
            onClick={() => {
              setShow(!showDropdown);
            }}>
            <i className="fa fa-crop" />
          </Button>
        </Tooltip>
      }>
      <DropdownList>
        <DropdownListItem onClick={action(null)}>No aspect ratio</DropdownListItem>
        <DropdownListItem onClick={action('original')}>Original aspect ratio</DropdownListItem>
        <DropdownListItem onClick={action(1)}>Square</DropdownListItem>
        <DropdownListItem onClick={action('circle')}>Circle (converts to PNG)</DropdownListItem>
        <DropdownListItem onClick={action(4 / 3)}>4:3</DropdownListItem>
        <DropdownListItem onClick={action(3 / 2)}>3:2</DropdownListItem>
        <DropdownListItem onClick={action(16 / 9)}>16:9</DropdownListItem>
        <DropdownListItem onClick={action('custom')}>Custom aspect ratio</DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
}

function canBeTransformed(file) {
  const fileType = get(file, 'contentType', '');
  return mimetype.getGroupLabel({ type: fileType }) === 'image';
}

export function FileEditorActions(props) {
  const tranformable = canBeTransformed(props.file);
  return (
    <div className={styles.root}>
      <DownloadButton {...props} />
      <ShowMetaButton {...props} />
      {tranformable && <RotateButton {...props} />}
      {tranformable && <ResizeButton {...props} />}
      {tranformable && <CropButton {...props} />}
      <DeleteButton {...props} />
    </div>
  );
}

const FileEditorActionsPropTypes = {
  file: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  onToggleMeta: PropTypes.func.isRequired,
  onRotate: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onCrop: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

FileEditorActions.propTypes = FileEditorActionsPropTypes;
DownloadButton.propTypes = FileEditorActionsPropTypes;
ShowMetaButton.propTypes = FileEditorActionsPropTypes;
RotateButton.propTypes = FileEditorActionsPropTypes;
ResizeButton.propTypes = FileEditorActionsPropTypes;
CropButton.propTypes = FileEditorActionsPropTypes;
DeleteButton.propTypes = FileEditorActionsPropTypes;
