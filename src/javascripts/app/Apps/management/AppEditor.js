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
  Tag,
  Card,
} from '@contentful/forma-36-react-components';
import * as WidgetLocations from 'widgets/WidgetLocations';
import { toInternalFieldType, toApiFieldType } from 'widgets/FieldTypes';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import NavigationIcon from 'ui/Components/NavigationIcon';
import UIIcon from 'ui/Components/Icon';

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
  input: (margin = true) =>
    css({
      marginBottom: margin ? tokens.spacingL : 0,
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
  fieldTypesOpen: (hasPadding = true) =>
    css({
      opacity: '1',
      height: hasPadding ? '215px' : '341px',
      padding: hasPadding ? tokens.spacingS : '0',
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
      color: tokens.colorTextDark,
    }),
    '& span': css({
      color: tokens.colorElementDarkest,
      fontFamily: tokens.fontStackMonospace,
    }),
  }),
  pageSwitch: css({
    padding: tokens.spacingM,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '& label': css({
      margin: 0,
    }),
    p: css({
      marginBottom: tokens.spacingS,
    }),
  }),
  pageLocation: (enabled = false) =>
    css({
      display: 'flex',
      flexDirection: 'row',
      '& > div': css({
        padding: tokens.spacingM,
        borderRight: `1px solid ${tokens.colorElementLight}`,
        flex: '50%',
        '&:last-child': css({
          border: 'none',
          padding: tokens.spacingXl,
        }),
      }),

      opacity: enabled ? 1 : '0.3',
      pointerEvents: enabled ? '' : 'none',
    }),
  pageLocationNav: css({
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    height: '100%',
    cursor: 'default',
  }),
  nav: css({
    color: tokens.colorWhite,
    backgroundColor: tokens.colorContrastLight,
    padding: tokens.spacingS,
    borderRadius: '4px 4px 0 0',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    '& span': css({
      marginLeft: tokens.spacingXs,
    }),
    '& > svg': css({
      margin: `2px 0 0 12px`,
    }),
  }),
  navItem: css({
    display: 'flex',
    alignItems: 'center',
    borderRadius: '0 0 2px 2px',
    color: tokens.colorTextMid,
    '& svg': css({
      marginRight: tokens.spacingXs,
    }),
    '& span': css({}),
  }),
  tag: css({
    marginBottom: tokens.spacingXs,
  }),
};

const LOCATION_ORDER = [
  ['App configuration screen', WidgetLocations.LOCATION_APP_CONFIG],
  ['Entry field', WidgetLocations.LOCATION_ENTRY_FIELD],
  ['Entry sidebar', WidgetLocations.LOCATION_ENTRY_SIDEBAR],
  ['Entry editor', WidgetLocations.LOCATION_ENTRY_EDITOR],
  ['Dialog', WidgetLocations.LOCATION_DIALOG],
  ['Page', WidgetLocations.LOCATION_PAGE],
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

  const getNavigationItemValue = (field) => {
    const pageLocation = getLocation(WidgetLocations.LOCATION_PAGE);

    if (!pageLocation || !pageLocation.navigationItem) {
      return '';
    }

    return pageLocation.navigationItem[field];
  };

  const togglePageLocationData = () => {
    const updated = cloneDeep(definition);
    const pageLocation = updated.locations[getLocationIndex(WidgetLocations.LOCATION_PAGE)];

    if (pageLocation.navigationItem) {
      delete pageLocation.navigationItem;
    } else {
      pageLocation.navigationItem = { path: '/', name: definition.name };
    }

    onChange(updated);
  };

  const updatePageLocation = ({ field, value }) => {
    const updated = cloneDeep(definition);
    const pageLocation = updated.locations[getLocationIndex(WidgetLocations.LOCATION_PAGE)];

    if (field === 'path' && !value.startsWith('/')) {
      value = `/${value}`;
    }

    pageLocation.navigationItem[field] = value.trim();

    onChange(updated);
  };

  const hasPageLocationNavigation = !!getLocation(WidgetLocations.LOCATION_PAGE)?.navigationItem;

  return (
    <>
      <div>
        <TextField
          className={styles.input()}
          required
          name="app-name"
          id="app-name"
          labelText="Name"
          testId="app-name-input"
          value={definition.name || ''}
          onChange={(e) => onChange({ ...definition, name: e.target.value })}
        />
        <TextField
          className={styles.input()}
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
                {(locationValue === WidgetLocations.LOCATION_ENTRY_FIELD ||
                  locationValue === WidgetLocations.LOCATION_PAGE) && (
                  <Icon icon="ListBulleted" color="secondary" />
                )}
              </ToggleButton>
              {locationValue === WidgetLocations.LOCATION_ENTRY_FIELD && (
                <div
                  className={[styles.fieldTypes]
                    .concat(hasLocation(locationValue) ? styles.fieldTypesOpen() : [])
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
              {locationValue === WidgetLocations.LOCATION_PAGE && (
                <div
                  className={[styles.fieldTypes]
                    .concat(hasLocation(locationValue) ? styles.fieldTypesOpen(false) : [])
                    .join(' ')}>
                  <div className={styles.pageSwitch}>
                    <Paragraph>
                      Optionally, you can show a link to the page location of your app in the main
                      navigation. <TextLink>Learn more</TextLink>.
                    </Paragraph>
                    <Switch
                      id="page-switch"
                      isChecked={hasPageLocationNavigation}
                      labelText="Show app in main navigation"
                      onToggle={togglePageLocationData}
                    />
                  </div>
                  <div className={styles.pageLocation(hasPageLocationNavigation)}>
                    <div>
                      <TextField
                        className={styles.input()}
                        required
                        textInputProps={{
                          maxLength: 40,
                        }}
                        name="page-link-name"
                        id="page-link-name"
                        labelText="Link name"
                        testId="page-link-name"
                        value={getNavigationItemValue('name')}
                        helpText="Maximum 40 characters."
                        onChange={(e) =>
                          updatePageLocation({ field: 'name', value: e.target.value })
                        }
                      />
                      <TextField
                        className={[styles.input(false), styles.linkPath].join(' ')}
                        required
                        textInputProps={{
                          maxLength: 512,
                        }}
                        name="page-link-path"
                        id="page-link-path"
                        labelText="Link path"
                        testId="page-link-path"
                        helpText="Maximum 512 characters."
                        value={getNavigationItemValue('path')}
                        onChange={(e) =>
                          updatePageLocation({ field: 'path', value: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <div className={styles.pageLocationNav}>
                        <Tag tagType="muted" className={styles.tag}>
                          Preview
                        </Tag>
                        <div className={styles.nav}>
                          <NavigationIcon icon="apps" size="medium" mono color="white" />{' '}
                          <span>Apps</span> <Icon icon="ArrowDown" color="white" />
                        </div>
                        <Card className={styles.navItem}>
                          <UIIcon name="page-apps" scale="0.65" />{' '}
                          <span>{getNavigationItemValue('name') || definition.name}</span>
                        </Card>
                      </div>
                    </div>
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
