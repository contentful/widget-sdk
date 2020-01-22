import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Paragraph } from '@contentful/forma-36-react-components';
import f36Tokens from '@contentful/forma-36-tokens';
import FileIcon from 'components/FileIcon/FileIcon';

const styles = {
  fileArchived: css({
    border: `1px solid ${f36Tokens.colorElementLight}`,
    padding: '10px 0',
    verticalAlign: 'middle',
    display: 'flex',
    alignItems: 'center'
  }),
  icon: css({
    display: 'inline-block',
    height: '22px',
    color: f36Tokens.colorTextLight
  })
};

export function FileEditorArchived(props) {
  return (
    <div className={styles.fileArchived}>
      <FileIcon file={props.file} className={styles.icon} />
      <Paragraph>Preview unavailable for archived assets</Paragraph>
    </div>
  );
}

FileEditorArchived.propTypes = {
  file: PropTypes.shape({
    contentType: PropTypes.string.isRequired
  })
};
