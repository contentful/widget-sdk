import React from 'react';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';
import {
  ToggleButton,
  Paragraph,
  Form,
  TextField,
  CheckboxField,
  FormLabel
} from '@contentful/forma-36-react-components';
import * as WidgetLocations from 'widgets/WidgetLocations';
import { toInternalFieldType, toApiFieldType } from 'widgets/FieldTypes';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  helpParagraph: css({}),
  locationToggle: css({
    width: '100%',
    padding: `${tokens.spacingXs} 0`,
    '& label ~ p': css({
      display: 'inline',
      marginLeft: tokens.spacingXs,
      color: tokens.colorElementDarkest
    })
  }),
  fieldTypes: css({
    opacity: '0',
    height: '0px',
    borderRadius: '2px',
    padding: '0',
    backgroundColor: tokens.colorElementLightest,
    border: `1px solid ${tokens.colorElementLight}`,
    transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
    p: css({
      color: tokens.colorTextMid
    })
  }),
  fieldTypesOpen: css({
    opacity: '1',
    height: '230px',
    padding: tokens.spacingS
  }),
  fieldTypeChecks: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr'
  }),
  entryFieldCheck: css({
    marginTop: tokens.spacingS
  })
};

const LOCATION_ORDER = [
  ['App configuration screen', WidgetLocations.LOCATION_APP_CONFIG],
  ['Entry field', WidgetLocations.LOCATION_ENTRY_FIELD],
  ['Entry sidebar', WidgetLocations.LOCATION_ENTRY_SIDEBAR],
  ['Entry editor', WidgetLocations.LOCATION_ENTRY_EDITOR],
  ['Dialog', WidgetLocations.LOCATION_DIALOG],
  ['Page', WidgetLocations.LOCATION_PAGE]
];

const FIELD_TYPES_ORDER = [
  ['Short text', 'Symbol'],
  ['Short text, list', 'Symbols'],
  ['Long text', 'Text'],
  ['Rich text', 'RichText'],
  ['Number, integer', 'Integer'],
  ['Number, decimal', 'Number'],
  ['Boolean', 'Boolean'],
  ['Date and time', 'Date'],
  ['Location', 'Location'],
  ['JSON object', 'Object'],
  ['Entry reference', 'Entry'],
  ['Entry reference, list', 'Entries'],
  ['Media reference', 'Asset'],
  ['Media reference, list', 'Assets']
];

export default function AppEditor({ definition, onChange }) {
  definition.locations = definition.locations || [];

  const getLocationIndex = locationValue => {
    return definition.locations.findIndex(({ location }) => {
      return location === locationValue;
    });
  };

  const getLocation = locationValue => definition.locations[getLocationIndex(locationValue)];
  const hasLocation = locationValue => !!getLocation(locationValue);

  const toggleLocation = locationValue => {
    const updated = cloneDeep(definition);

    if (hasLocation(locationValue)) {
      updated.locations = updated.locations.filter(({ location }) => {
        return location !== locationValue;
      });
    } else {
      updated.locations = definition.locations.concat([{ location: locationValue }]);
    }

    onChange(updated);
  };

  const getFieldTypeIndex = internalFieldType => {
    const entryFieldLocation = getLocation(WidgetLocations.LOCATION_ENTRY_FIELD);
    if (entryFieldLocation && Array.isArray(entryFieldLocation.fieldTypes)) {
      return entryFieldLocation.fieldTypes.map(toInternalFieldType).indexOf(internalFieldType);
    } else {
      return -1;
    }
  };

  const hasFieldType = internalFieldType => getFieldTypeIndex(internalFieldType) > -1;

  const toggleFieldType = internalFieldType => {
    const updated = cloneDeep(definition);
    const locationIndex = getLocationIndex(WidgetLocations.LOCATION_ENTRY_FIELD);
    const entryFieldLocation = updated.locations[locationIndex];
    const fieldTypeIndex = getFieldTypeIndex(internalFieldType);

    if (fieldTypeIndex > -1) {
      entryFieldLocation.fieldTypes = (entryFieldLocation.fieldTypes || []).filter(
        (_, i) => i !== fieldTypeIndex
      );
    } else {
      entryFieldLocation.fieldTypes = (entryFieldLocation.fieldTypes || []).concat([
        toApiFieldType(internalFieldType)
      ]);
    }

    onChange(updated);
  };

  return (
    <>
      <Form>
        <TextField
          required
          name="app-name"
          id="app-name"
          labelText="Name"
          value={definition.name || ''}
          onChange={e => onChange({ ...definition, name: e.target.value })}
        />
        <TextField
          required
          name="app-src"
          id="app-src"
          labelText="Source URL"
          value={definition.src || ''}
          helpText="Valid URLs use HTTPS. Only localhost can use HTTP."
          onChange={e => onChange({ ...definition, src: e.target.value })}
        />

        <div>
          <FormLabel>Locations</FormLabel>
          <Paragraph className={styles.helpParagraph}>
            Specify where the app can be rendered. Check out the documentation for more details.
          </Paragraph>
        </div>
        {LOCATION_ORDER.map(([name, locationValue]) => {
          return (
            <>
              <ToggleButton
                key={locationValue}
                className={styles.locationToggle}
                isActive={hasLocation(locationValue)}
                onClick={() => toggleLocation(locationValue)}>
                <CheckboxField
                  labelText={name}
                  onChange={() => toggleLocation(locationValue)}
                  checked={hasLocation(locationValue)}
                  helpText={`(${locationValue})`}
                  id={`app-location-${locationValue}`}
                />
              </ToggleButton>
              {locationValue === WidgetLocations.LOCATION_ENTRY_FIELD && (
                <div
                  className={[styles.fieldTypes]
                    .concat(hasLocation(locationValue) ? styles.fieldTypesOpen : [])
                    .join(' ')}>
                  <Paragraph>Select the field types the app can be rendered in.</Paragraph>
                  <div className={styles.fieldTypeChecks}>
                    {FIELD_TYPES_ORDER.map(([label, internalFieldType]) => {
                      return (
                        <CheckboxField
                          className={styles.entryFieldCheck}
                          key={internalFieldType}
                          labelText={label}
                          onChange={() => toggleFieldType(internalFieldType)}
                          checked={hasFieldType(internalFieldType)}
                          id={`app-entry-field-type-${internalFieldType}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          );
        })}
      </Form>
    </>
  );
}

AppEditor.propTypes = {
  definition: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};
