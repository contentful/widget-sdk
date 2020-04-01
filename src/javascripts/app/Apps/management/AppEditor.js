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
  Switch,
  Note,
  TextLink,
} from '@contentful/forma-36-react-components';
import * as WidgetLocations from 'widgets/WidgetLocations';
import { toInternalFieldType, toApiFieldType } from 'widgets/FieldTypes';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { MARKETPLACE_ORG_ID } from '../config';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

const styles = {
  helpParagraph: css({
    color: tokens.colorTextLight,
  }),
  input: css({
    marginBottom: tokens.spacingL,
  }),
  toggleContainer: css({
    marginBottom: tokens.spacingXs,
  }),
  locationP: css({
    marginBottom: tokens.spacingL,
  }),
  locationToggle: css({
    width: '100%',
    padding: `${tokens.spacing2Xs} 0`,
    '& label ~ p': css({
      display: 'inline',
      marginLeft: tokens.spacingXs,
      color: tokens.colorElementDarkest,
      fontFamily: tokens.fontStackMonospace,
    }),
    '& svg': css({
      position: 'absolute',
      right: tokens.spacingS,
      top: 'calc(50% - 9px)',
    }),
  }),
  fieldTypes: css({
    opacity: '0',
    height: '0px',
    borderRadius: '2px',
    padding: '0',
    backgroundColor: tokens.colorElementLightest,
    border: `1px solid ${tokens.colorElementLight}`,
    transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
    overflow: 'hidden',
    p: css({
      color: tokens.colorTextMid,
    }),
  }),
  fieldTypesOpen: css({
    opacity: '1',
    height: '215px',
    padding: tokens.spacingS,
    overflow: 'hidden',
  }),
  fieldTypeChecks: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
  }),
  entryFieldCheck: css({
    marginTop: tokens.spacingS,
  }),
  publicSwitch: css({
    marginTop: tokens.spacingL,
  }),
  checkbox: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    '& input': css({
      verticalAlign: 'text-top',
      marginRight: tokens.spacingXs,
      cursor: 'pointer',
    }),
    '& label': css({
      fontWeight: tokens.fontWeightMedium,
      marginRight: tokens.spacingXs,
      cursor: 'pointer',
    }),
    '& span': css({
      color: tokens.colorElementDarkest,
      fontFamily: tokens.fontStackMonospace,
    }),
  }),
};

const LOCATION_ORDER = [
  ['App configuration screen', WidgetLocations.LOCATION_APP_CONFIG],
  ['Entry field', WidgetLocations.LOCATION_ENTRY_FIELD],
  ['Entry sidebar', WidgetLocations.LOCATION_ENTRY_SIDEBAR],
  ['Entry editor', WidgetLocations.LOCATION_ENTRY_EDITOR],
  ['Dialog', WidgetLocations.LOCATION_DIALOG],
];

const FIELD_TYPES_ORDER = [
  ['Short text', 'Symbol'],
  ['Number, decimal', 'Number'],
  ['Entry reference', 'Entry'],
  ['Short text, list', 'Symbols'],
  ['Date and time', 'Date'],
  ['Entry reference, list', 'Entries'],
  ['Long text', 'Text'],
  ['Location', 'Location'],
  ['Media reference', 'Asset'],
  ['Rich text', 'RichText'],
  ['Boolean', 'Boolean'],
  ['Media reference, list', 'Assets'],
  ['Number, integer', 'Integer'],
  ['JSON object', 'Object'],
];

export default function AppEditor({ definition, onChange }) {
  definition.locations = definition.locations || [];

  const getLocationIndex = (locationValue) => {
    return definition.locations.findIndex(({ location }) => {
      return location === locationValue;
    });
  };

  const getLocation = (locationValue) => definition.locations[getLocationIndex(locationValue)];
  const hasLocation = (locationValue) => !!getLocation(locationValue);

  const toggleLocation = (locationValue) => {
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

  const getFieldTypeIndex = (internalFieldType) => {
    const entryFieldLocation = getLocation(WidgetLocations.LOCATION_ENTRY_FIELD);
    if (entryFieldLocation && Array.isArray(entryFieldLocation.fieldTypes)) {
      return entryFieldLocation.fieldTypes.map(toInternalFieldType).indexOf(internalFieldType);
    } else {
      return -1;
    }
  };

  const hasFieldType = (internalFieldType) => getFieldTypeIndex(internalFieldType) > -1;

  const toggleFieldType = (internalFieldType) => {
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
        toApiFieldType(internalFieldType),
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
          onChange={(e) => onChange({ ...definition, name: e.target.value })}
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
          onChange={(e) => onChange({ ...definition, src: e.target.value })}
        />
        <div className={styles.locationP}>
          <FormLabel htmlFor="">Locations</FormLabel>
          <Paragraph className={styles.helpParagraph}>
            Specify where the app can be rendered. Check out the{' '}
            <TextLink
              href={withInAppHelpUtmParams(
                'https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-definitions'
              )}
              target="_blank"
              rel="noopener noreferrer">
              documentation
            </TextLink>{' '}
            for more details.
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
                <div className={styles.checkbox}>
                  <div>
                    {/* eslint-disable-next-line rulesdir/restrict-non-f36-components */}
                    <input
                      onChange={() => {}}
                      name={`location-check-${name}`}
                      type="checkbox"
                      checked={hasLocation(locationValue)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`location-check${name}`}>{name}</label>
                  </div>
                  <div>
                    <span>({locationValue})</span>
                  </div>
                </div>
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
        {definition.sys.organization.sys.id === MARKETPLACE_ORG_ID && (
          <div className={styles.publicSwitch}>
            <Switch
              testId="public-switch"
              id="public-switch"
              isChecked={definition.public}
              labelText="Public"
              onToggle={() => togglePublic()}
            />
            <br />
            <Note noteType="warning" title="ENTERING THE DANGER ZONE">
              You are about to modify the definition of a Contentful Marketplace app!
            </Note>
          </div>
        )}
      </div>
    </>
  );
}

AppEditor.propTypes = {
  definition: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
