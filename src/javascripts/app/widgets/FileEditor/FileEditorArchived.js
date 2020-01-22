import React from 'react';
import PropTypes from 'prop-types';
import Thumbnail from 'components/Thumbnail/Thumbnail';
import { css } from 'emotion';
import { Paragraph } from '@contentful/forma-36-react-components';
import f36Tokens from '@contentful/forma-36-tokens';

const styles = {
  fileArchived: css({
    border: `1px solid ${f36Tokens.colorElementLight}`,
    padding: '10px',
    verticalAlign: 'middle',
    display: 'flex',
    alignItems: 'center',
    '.icon': {
      display: 'inline-block',
      fontSize: '22px',
      color: '#adbac2',
      marginRight: '10px'
    }
  })
};

export function FileEditorArchived(props) {
  return (
    <div className={styles.fileArchived}>
      <Thumbnail file={props.file} icon />
      <Paragraph>Preview unavailable for archived assets</Paragraph>
    </div>
  );
}

FileEditorArchived.propTypes = {
  file: PropTypes.shape({
    contentType: PropTypes.string.isRequired
  })
};
