import {
  Card,
  CheckboxField,
  FormLabel,
  Icon,
  Note,
  Paragraph,
  Switch,
  Tag,
  TextField,
  TextLink,
  ToggleButton,
  ValidationMessage,
} from '@contentful/forma-36-react-components';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { WidgetLocation } from '@contentful/widget-renderer';
import c from 'classnames';
import { MARKETPLACE_ORG_ID } from 'features/apps/config';
import { cloneDeep, isEmpty, isEqual, noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { toApiFieldType, toInternalFieldType } from 'widgets/FieldTypes';
import { FIELD_TYPES_ORDER, LOCATION_ORDER, SRC_REG_EXP } from './constants';
import { styles } from './styles';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

export function validate(definition) {
  const errors = [];

  if (isEmpty(definition.name)) {
    errors.push({
      path: ['name'],
      details: 'Please enter an app name',
    });
  }

  if (!isEmpty(definition.src) && !SRC_REG_EXP.test(definition.src)) {
    errors.push({
      path: ['src'],
      details: 'Please enter a valid URL',
    });
  }

  const entryFieldLocation = definition.locations.find(
    (l) => l.location === WidgetLocation.ENTRY_FIELD
  );
  if (entryFieldLocation && (entryFieldLocation.fieldTypes ?? []).length === 0) {
    errors.push({
      path: ['locations', 'entry-field', 'fieldTypes'],
      details: 'Please select at least one field type',
    });
  }

  const pageLocation = definition.locations.find((l) => l.location === WidgetLocation.PAGE);
  if (pageLocation?.navigationItem) {
    if (isEmpty(pageLocation.navigationItem.name)) {
      errors.push({
        path: ['locations', 'page', 'navigationItem', 'name'],
        details: 'Please enter a link name',
      });
    }

    if (!pageLocation?.navigationItem.path.startsWith('/')) {
      errors.push({
        path: ['locations', 'page', 'navigationItem', 'path'],
        details: 'Please enter a path starting with /',
      });
    }
  }

  return errors;
}

export function AppEditor({ definition, onChange, errors = [], onErrorsChange = noop }) {
  definition.locations = definition.locations || [];

  const clearErrorForField = (path) => {
    onErrorsChange(errors.filter((error) => !isEqual(error.path, path)));
  };

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
    const entryFieldLocation = getLocation(WidgetLocation.ENTRY_FIELD);
    if (entryFieldLocation && Array.isArray(entryFieldLocation.fieldTypes)) {
      return entryFieldLocation.fieldTypes.map(toInternalFieldType).indexOf(internalFieldType);
    } else {
      return -1;
    }
  };

  const hasFieldType = (internalFieldType) => getFieldTypeIndex(internalFieldType) > -1;

  const toggleFieldType = (internalFieldType) => {
    const updated = cloneDeep(definition);
    const locationIndex = getLocationIndex(WidgetLocation.ENTRY_FIELD);
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
    const pageLocation = getLocation(WidgetLocation.PAGE);

    if (!pageLocation || !pageLocation.navigationItem) {
      return '';
    }

    return pageLocation.navigationItem[field];
  };

  const togglePageLocationData = () => {
    const updated = cloneDeep(definition);
    const pageLocation = updated.locations[getLocationIndex(WidgetLocation.PAGE)];

    if (pageLocation.navigationItem) {
      delete pageLocation.navigationItem;
    } else {
      pageLocation.navigationItem = { path: '/', name: definition.name };
    }

    onChange(updated);
  };

  const updatePageLocation = ({ field, value }) => {
    const updated = cloneDeep(definition);
    const pageLocation = updated.locations[getLocationIndex(WidgetLocation.PAGE)];

    if (field === 'path' && !value.startsWith('/')) {
      value = `/${value}`;
    }

    pageLocation.navigationItem[field] = value.trim();

    onChange(updated);
  };

  const hasPageLocationNavigation = !!getLocation(WidgetLocation.PAGE)?.navigationItem;

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
          onChange={(e) => {
            clearErrorForField(['name']);
            onChange({ ...definition, name: e.target.value.trim() });
          }}
          validationMessage={errors.find((error) => isEqual(error.path, ['name']))?.details}
        />
        <TextField
          className={styles.input()}
          name="app-src"
          id="app-src"
          labelText="App URL"
          testId="app-src-input"
          value={definition.src || ''}
          helpText="Only required if your app renders into locations within the Contentful web app. Public URLs must use HTTPS."
          onChange={(e) => {
            clearErrorForField(['src']);
            onChange({ ...definition, src: e.target.value.trim() });
          }}
          validationMessage={errors.find((error) => isEqual(error.path, ['src']))?.details}
        />
        {definition.src && (
          <>
            <div className={styles.locationP}>
              <FormLabel htmlFor="">Locations</FormLabel>
              <Paragraph className={styles.helpParagraph}>
                Specify where your app can be rendered. Learn more about{' '}
                <TextLink
                  href={withInAppHelpUtmParams(
                    'https://www.contentful.com/developers/docs/extensibility/app-framework/locations/'
                  )}
                  target="_blank"
                  rel="noopener noreferrer">
                  app locations
                </TextLink>
                .
              </Paragraph>
            </div>
            {LOCATION_ORDER.map(([name, locationValue]) => {
              return (
                <div key={locationValue} className={styles.toggleContainer}>
                  <ToggleButton
                    testId={`app-location-${locationValue}`}
                    className={styles.locationToggle}
                    isActive={hasLocation(locationValue)}
                    isDisabled={locationValue === WidgetLocation.DIALOG}
                    onClick={() => toggleLocation(locationValue)}>
                    <div className={styles.checkbox}>
                      <div>
                        {/* eslint-disable-next-line rulesdir/restrict-non-f36-components */}
                        <input
                          onChange={() => {}}
                          name={`location-check-${name}`}
                          type="checkbox"
                          checked={
                            hasLocation(locationValue) || locationValue === WidgetLocation.DIALOG
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor={`location-check${name}`}>{name}</label>
                      </div>
                      <div>
                        <span>({locationValue})</span>
                      </div>
                      {(locationValue === WidgetLocation.ENTRY_FIELD ||
                        locationValue === WidgetLocation.PAGE) && (
                        <div className={styles.checkboxInfoIcon}>
                          <Icon icon="ListBulleted" color="secondary" />
                        </div>
                      )}
                      {locationValue === WidgetLocation.DIALOG && (
                        <div className={styles.checkboxInfo}>
                          All locations can open dialogs programmatically
                        </div>
                      )}
                    </div>
                  </ToggleButton>
                  {locationValue === WidgetLocation.ENTRY_FIELD && (
                    <div
                      className={c(
                        styles.fieldTypes,
                        styles.fieldTypesPadding(hasLocation(locationValue)),
                        {
                          [styles.fieldTypesOpen]: hasLocation(locationValue),
                        }
                      )}>
                      <Paragraph>Select the field types the app can be rendered in.</Paragraph>
                      <div className={styles.fieldTypeChecks}>
                        {FIELD_TYPES_ORDER.map(([label, internalFieldType]) => {
                          return (
                            <CheckboxField
                              className={styles.entryFieldCheck}
                              key={internalFieldType}
                              labelText={label}
                              onChange={() => {
                                clearErrorForField(['locations', 'entry-field', 'fieldTypes']);
                                toggleFieldType(internalFieldType);
                              }}
                              checked={hasFieldType(internalFieldType)}
                              id={`app-entry-field-type-${internalFieldType}`}
                            />
                          );
                        })}
                      </div>
                      {errors.find((error) =>
                        isEqual(error.path, ['locations', 'entry-field', 'fieldTypes'])
                      ) && (
                        <ValidationMessage className={styles.fieldTypesValidationMessage}>
                          {
                            errors.find((error) =>
                              isEqual(error.path, ['locations', 'entry-field', 'fieldTypes'])
                            ).details
                          }
                        </ValidationMessage>
                      )}
                    </div>
                  )}
                  {locationValue === WidgetLocation.PAGE && (
                    <div
                      className={c(styles.fieldTypes, {
                        [styles.fieldTypesOpen]: hasLocation(locationValue),
                      })}>
                      <div className={styles.pageSwitch}>
                        <Paragraph>
                          Optionally, you can show a link to the page location of your app in the
                          main navigation.{' '}
                          <TextLink
                            href="https://www.contentful.com/developers/docs/references/content-management-api/#page-location"
                            target="_blank"
                            rel="noopener noreferrer">
                            Learn more
                          </TextLink>
                          .
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
                              placeholder: definition.name,
                            }}
                            name="page-link-name"
                            id="page-link-name"
                            labelText="Link name"
                            testId="page-link-name"
                            value={getNavigationItemValue('name')}
                            helpText="Maximum 40 characters."
                            onChange={(e) => {
                              clearErrorForField(['locations', 'page', 'navigationItem', 'name']);
                              updatePageLocation({ field: 'name', value: e.target.value });
                            }}
                            validationMessage={
                              errors.find((error) =>
                                isEqual(error.path, ['locations', 'page', 'navigationItem', 'name'])
                              )?.details
                            }
                          />
                          <TextField
                            className={[styles.input(false), styles.linkPath].join(' ')}
                            required
                            textInputProps={{
                              maxLength: 512,
                              placeholder: '/',
                            }}
                            name="page-link-path"
                            id="page-link-path"
                            labelText="Link path"
                            testId="page-link-path"
                            helpText="Maximum 512 characters."
                            value={getNavigationItemValue('path')}
                            onChange={(e) => {
                              clearErrorForField(['locations', 'page', 'navigationItem', 'path']);
                              updatePageLocation({ field: 'path', value: e.target.value });
                            }}
                            validationMessage={
                              errors.find((error) =>
                                isEqual(error.path, ['locations', 'page', 'navigationItem', 'path'])
                              )?.details
                            }
                          />
                        </div>
                        <div>
                          <div className={styles.pageLocationNav}>
                            <Tag tagType="muted" className={styles.tag}>
                              Preview
                            </Tag>
                            <div className={styles.nav}>
                              <NavigationIcon icon="Apps" size="medium" color="white" />{' '}
                              <span>Apps</span> <Icon icon="ArrowDown" color="white" />
                            </div>
                            <Card className={styles.navItem}>
                              <span className={styles.navItemIcon}>
                                <NavigationIcon icon="Apps" size="small" />{' '}
                              </span>
                              <span>{getNavigationItemValue('name')}</span>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
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
  errors: PropTypes.array,
  onErrorsChange: PropTypes.func,
};
