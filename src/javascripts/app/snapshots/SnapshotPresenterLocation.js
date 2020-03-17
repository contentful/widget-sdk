import React from 'react';
import PropTypes from 'prop-types';
import { Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  paragraph: css({
    marginBottom: tokens.spacingS
  })
};

const SnapshotPresenterLocation = ({ value }) => {
  return (
    <div data-test-id="snapshot-presenter-location">
      <Paragraph className={styles.paragraph}>
        <strong>Longitude:</strong> {value.lon}
      </Paragraph>
      <Paragraph className={styles.paragraph}>
        <strong>Latitude:</strong> {value.lat}
      </Paragraph>
    </div>
  );
};

SnapshotPresenterLocation.propTypes = {
  value: PropTypes.shape({
    lon: PropTypes.number,
    lat: PropTypes.number
  }).isRequired
};

export default SnapshotPresenterLocation;
