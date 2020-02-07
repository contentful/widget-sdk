import React from 'react';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';
import {
  ToggleButton,
  Paragraph,
  TextField,
  CheckboxField,
  FormLabel,
  Icon,
  Switch
} from '@contentful/forma-36-react-components';
import * as WidgetLocations from 'widgets/WidgetLocations';
import { toInternalFieldType, toApiFieldType } from 'widgets/FieldTypes';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  helpParagraph: css({
    color: tokens.colorTextLight
  }),
  input: css({
    marginBottom: tokens.spacingL
  }),
  toggleContainer: css({
    marginBottom: tokens.spacingXs
  }),
  locationP: css({
    marginBottom: tokens.spacingL
  }),
  locationToggle: css({
    width: '100%',
    padding: `${tokens.spacing2Xs} 0`,
    '& label ~ p': css({
      display: 'inline',
      marginLeft: tokens.spacingXs,
      color: tokens.colorElementDarkest,
      fontFamily: tokens.fontStackMonospace
    }),
    '& svg': css({
      position: 'absolute',
      right: tokens.spacingS,
      top: 'calc(50% - 9px)'
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
  }),
  publicSwitch: css({
    marginTop: tokens.spacingL
  })
};

const PUBLIC_ORG_ID = '5EJGHo8tYJcjnEhYWDxivp';

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

  const togglePublic = () => {
    const updated = cloneDeep(definition);
    updated.public = !updated.public;

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
      <div>
        <TextField
          className={styles.input}
          required
          name="app-name"
          id="app-name"
          labelText="Name"
          testId="app-name-input"
          value={definition.name || ''}
          onChange={e => onChange({ ...definition, name: e.target.value })}
        />
        <TextField
          className={styles.input}
          required
          name="app-src"
          id="app-src"
          labelText="Source URL"
          testId="app-src-input"
          value={definition.src || ''}
          helpText="Valid URLs use HTTPS. Only localhost can use HTTP."
          onChange={e => onChange({ ...definition, src: e.target.value })}
        />
        <div className={styles.locationP}>
          <FormLabel htmlFor="">Locations</FormLabel>
          <Paragraph className={styles.helpParagraph}>
            Specify where the app can be rendered. Check out the documentation for more details.
          </Paragraph>
        </div>
        {LOCATION_ORDER.map(([name, locationValue]) => {
          return (
            <div key={locationValue} className={styles.toggleContainer}>
              <ToggleButton
                testId={`app-location-${locationValue}`}
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
                {locationValue === WidgetLocations.LOCATION_ENTRY_FIELD && (
                  <Icon icon="ListBulleted" color="secondary" />
                )}
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
            </div>
          );
        })}
        {definition.sys.organization.sys.id === PUBLIC_ORG_ID && (
          <div className={styles.publicSwitch}>
            <Switch
              testId="public-switch"
              id="public-switch"
              isChecked={definition.public}
              labelText="Public"
              onToggle={() => togglePublic()}
            />
          </div>
        )}
      </div>
    </>
  );
}

AppEditor.propTypes = {
  definition: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};
