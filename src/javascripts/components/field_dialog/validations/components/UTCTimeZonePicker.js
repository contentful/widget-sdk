import React from 'react';
import PropTypes from 'prop-types';
import { Select, Option, FormLabel } from '@contentful/forma-36-react-components';
import { zoneOffsets } from '@contentful/field-editor-date';
import moment from 'moment-timezone';

const UTCTimeZonePicker = ({ disabled, onChange, value }) => {
  return (
    <div>
      <FormLabel htmlFor="timezone-input">Timezone</FormLabel>
      <Select
        aria-label="Select UTC timezone"
        id="timezone-input"
        value={
          value ||
          moment()
            .tz(moment.tz.guess())
            .format('Z')
        }
        width="medium"
        isDisabled={disabled}
        onChange={e => {
          onChange(e.currentTarget.value);
        }}>
        {zoneOffsets.map(offset => (
          <Option key={offset} value={offset}>
            UTC{offset}
          </Option>
        ))}
      </Select>
    </div>
  );
};

UTCTimeZonePicker.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string
};

export default UTCTimeZonePicker;
