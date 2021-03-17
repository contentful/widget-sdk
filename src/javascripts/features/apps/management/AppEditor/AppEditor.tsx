import {
  Card,
  CheckboxField,
  Checkbox,
  FormLabel,
  Icon,
  Paragraph,
  Switch,
  Tag,
  TextField,
  TextLink,
  ToggleButton,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { WidgetLocation } from '@contentful/widget-renderer';
import c from 'classnames';
import { cloneDeep, isEmpty, isEqual, noop } from 'lodash';
import React from 'react';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { toApiFieldType, toInternalFieldType } from 'widgets/FieldTypes';
import { ConditionalValidationMessage } from './ConditionalValidationMessage';
import { FIELD_TYPES_ORDER, LOCATION_ORDER, SRC_REG_EXP } from './constants';
import { InstanceParameterEditor } from './InstanceParameterEditor';
import { styles } from './styles';
import { ValidationError } from './types';
import { AppDefinition, AppLocation, FieldType } from 'contentful-management/types';
import { FLAGS, getVariation } from 'LaunchDarkly';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

export function validate(definition, errorPath: string[] = []) {
  const errors: ValidationError[] = [];

  if (isEmpty(definition.name)) {
    errors.push({
      path: [...errorPath, 'name'],
      details: 'Please enter an app name',
    });
  }

  if (!isEmpty(definition.src) && !SRC_REG_EXP.test(definition.src)) {
    errors.push({
      path: [...errorPath, 'src'],
      details: 'Please enter a valid URL',
    });
  }

  const entryFieldLocation = definition.locations.find(
    (l) => l.location === WidgetLocation.ENTRY_FIELD
  );
  if (entryFieldLocation && (entryFieldLocation.fieldTypes ?? []).length === 0) {
    errors.push({
      path: [...errorPath, 'locations', 'entry-field', 'fieldTypes'],
      details: 'Please select at least one field type',
    });
  }

  const pageLocation = definition.locations.find((l) => l.location === WidgetLocation.PAGE);
  if (pageLocation?.navigationItem) {
    if (isEmpty(pageLocation.navigationItem.name)) {
      errors.push({
        path: [...errorPath, 'locations', 'page', 'navigationItem', 'name'],
        details: 'Please enter a link name',
      });
    }

    if (!pageLocation?.navigationItem.path.startsWith('/')) {
      errors.push({
        path: [...errorPath, 'locations', 'page', 'navigationItem', 'path'],
        details: 'Please enter a path starting with /',
      });
    }
  }

  return errors;
}

interface AppEditorProps {
  definition: AppDefinition;
  onChange: (appDefinition: AppDefinition) => void;
  errorPath?: string[];
  errors?: ValidationError[];
  onErrorsChange?: (errors: ValidationError[]) => void;
  disabled: boolean;
}

type DefinitionWithLocations = Exclude<AppDefinition, 'locations'> & { locations: AppLocation[] };

const hasLocations = (definition: AppDefinition): definition is DefinitionWithLocations =>
  !!definition.locations && typeof definition.locations === 'object';

// TODO export from management types
interface EntryFieldLocation {
  location: 'entry-field';
  fieldTypes: FieldType[];
}
interface NavigationItem {
  name: string;
  path: string;
}
interface PageLocation {
  location: 'page';
  navigationItem?: NavigationItem;
}

const isEntryFieldLocation = (location: AppLocation): location is EntryFieldLocation =>
  location && location.location === 'entry-field' && Array.isArray(location.fieldTypes);

const isPageLocation = (location: AppLocation): location is PageLocation =>
  location && location.location === 'page' && 'navigationItem' in location;

type PageLocationWithNavigation = Exclude<PageLocation, 'navigationItem'> & {
  navigationItem: NavigationItem;
};
const hasNavigation = (pageLocation: PageLocation): pageLocation is PageLocationWithNavigation =>
  pageLocation && !!pageLocation.navigationItem && typeof pageLocation.navigationItem === 'object';

export function AppEditor({
  definition,
  onChange,
  errorPath = [],
  errors = [],
  onErrorsChange = noop,
  disabled,
}: AppEditorProps) {
  definition.locations = definition.locations || [];
  if (!hasLocations(definition)) {
    throw new Error('App Definition had no locations in App Editor');
  }

  const [hostingEnabled, setHostingEnabled] = React.useState(false);

  React.useEffect(() => {
    getVariation(FLAGS.APP_HOSTING_UI).then((value) => setHostingEnabled(value));
  }, []);

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

  const getFieldTypeIndex = (internalFieldType: string): number => {
    const entryFieldLocation = getLocation(WidgetLocation.ENTRY_FIELD);
    if (isEntryFieldLocation(entryFieldLocation)) {
      return entryFieldLocation.fieldTypes.map(toInternalFieldType).indexOf(internalFieldType);
    } else {
      return -1;
    }
  };

  const hasFieldType = (internalFieldType: string): boolean =>
    getFieldTypeIndex(internalFieldType) > -1;

  const toggleFieldType = (internalFieldType: string): void => {
    const updated = cloneDeep(definition);
    const locationIndex = getLocationIndex(WidgetLocation.ENTRY_FIELD);
    const entryFieldLocation = updated.locations[locationIndex];
    const fieldTypeIndex = getFieldTypeIndex(internalFieldType);

    if (fieldTypeIndex > -1) {
      (entryFieldLocation as EntryFieldLocation).fieldTypes = ('fieldTypes' in entryFieldLocation
        ? entryFieldLocation.fieldTypes
        : []
      ).filter((_, i) => i !== fieldTypeIndex);
    } else {
      (entryFieldLocation as EntryFieldLocation).fieldTypes = ('fieldTypes' in entryFieldLocation
        ? entryFieldLocation.fieldTypes
        : []
      ).concat([toApiFieldType(internalFieldType)]);
    }

    onChange(updated);
  };

  const getNavigationItemValue = (field: 'name' | 'path'): string => {
    const pageLocation = getLocation(WidgetLocation.PAGE);

    if (!pageLocation || !isPageLocation(pageLocation) || !pageLocation.navigationItem) {
      return '';
    }

    return pageLocation.navigationItem[field];
  };

  const togglePageLocationData = (): void => {
    const updated = cloneDeep(definition);
    const pageLocation = updated.locations[getLocationIndex(WidgetLocation.PAGE)];

    if (isPageLocation(pageLocation) && hasNavigation(pageLocation)) {
      delete pageLocation.navigationItem;
    } else {
      (pageLocation as PageLocation).navigationItem = { path: '/', name: definition.name };
    }

    onChange(updated);
  };

  const updatePageLocation = ({
    field,
    value,
  }: {
    field: 'name' | 'path';
    value: string;
  }): void => {
    const updated = cloneDeep(definition);
    const pageLocation = updated.locations[getLocationIndex(WidgetLocation.PAGE)];
    if (isPageLocation(pageLocation) && hasNavigation(pageLocation)) {
      if (field === 'path' && !value.startsWith('/')) {
        value = `/${value}`;
      }

      pageLocation.navigationItem[field] = value.trim();

      onChange(updated);
    }
  };

  const pageLocation = getLocation(WidgetLocation.PAGE);
  const hasPageLocationNavigation = isPageLocation(pageLocation) && hasNavigation(pageLocation);

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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            clearErrorForField([...errorPath, 'name']);
            onChange({ ...definition, name: e.target.value.trim() });
          }}
          validationMessage={
            errors.find((error) => isEqual(error.path, [...errorPath, 'name']))?.details
          }
          textInputProps={{ disabled }}
        />
        {hostingEnabled && <div>HELLo</div>}
        <TextField
          className={styles.input()}
          name="app-src"
          id="app-src"
          labelText="App URL"
          testId="app-src-input"
          value={definition.src || ''}
          helpText="Only required if your app renders into locations within the Contentful web app. Public URLs must use HTTPS."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            clearErrorForField([...errorPath, 'src']);
            onChange({ ...definition, src: e.target.value.trim() });
          }}
          validationMessage={
            errors.find((error) => isEqual(error.path, [...errorPath, 'src']))?.details
          }
          textInputProps={{ disabled }}
        />

        {definition.src && (
          <>
            <div className={styles.location}>
              <div className={styles.locationLabel}>
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
              <div>
                {LOCATION_ORDER.map(([name, locationValue]) => {
                  return (
                    <div key={locationValue} className={styles.toggleContainer}>
                      <ToggleButton
                        testId={`app-location-${locationValue}`}
                        className={styles.locationToggle}
                        isActive={hasLocation(locationValue)}
                        onToggle={() => toggleLocation(locationValue)}
                        isDisabled={disabled}>
                        <div className={styles.checkbox}>
                          <div className={styles.checkboxInput}>
                            <Checkbox
                              onChange={noop}
                              name={`location-check-${name}`}
                              checked={hasLocation(locationValue)}
                              labelText={name}
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
                                    clearErrorForField([
                                      ...errorPath,
                                      'locations',
                                      'entry-field',
                                      'fieldTypes',
                                    ]);
                                    toggleFieldType(internalFieldType);
                                  }}
                                  checked={hasFieldType(internalFieldType)}
                                  id={`app-entry-field-type-${internalFieldType}`}
                                  disabled={disabled}
                                />
                              );
                            })}
                          </div>

                          <ConditionalValidationMessage
                            errors={errors}
                            path={['locations', 'entry-field', 'fieldTypes']}
                          />
                        </div>
                      )}
                      {locationValue === WidgetLocation.PAGE && (
                        <div
                          className={c(styles.fieldTypes, {
                            [styles.fieldTypesOpen]: hasLocation(locationValue),
                          })}>
                          <div className={styles.pageSwitch}>
                            <Paragraph>
                              Optionally, you can show a link to the page location of your app in
                              the main navigation.{' '}
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
                                  disabled,
                                }}
                                name="page-link-name"
                                id="page-link-name"
                                labelText="Link name"
                                testId="page-link-name"
                                value={getNavigationItemValue('name')}
                                helpText="Maximum 40 characters."
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  clearErrorForField([
                                    ...errorPath,
                                    'locations',
                                    'page',
                                    'navigationItem',
                                    'name',
                                  ]);
                                  updatePageLocation({ field: 'name', value: e.target.value });
                                }}
                                validationMessage={
                                  errors.find((error) =>
                                    isEqual(error.path, [
                                      ...errorPath,
                                      'locations',
                                      'page',
                                      'navigationItem',
                                      'name',
                                    ])
                                  )?.details
                                }
                              />
                              <TextField
                                className={styles.input(false)}
                                required
                                textInputProps={{
                                  maxLength: 512,
                                  placeholder: '/',
                                  disabled,
                                }}
                                name="page-link-path"
                                id="page-link-path"
                                labelText="Link path"
                                testId="page-link-path"
                                helpText="Maximum 512 characters."
                                value={getNavigationItemValue('path')}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  clearErrorForField([
                                    ...errorPath,
                                    'locations',
                                    'page',
                                    'navigationItem',
                                    'path',
                                  ]);
                                  updatePageLocation({ field: 'path', value: e.target.value });
                                }}
                                validationMessage={
                                  errors.find((error) =>
                                    isEqual(error.path, [
                                      ...errorPath,
                                      'locations',
                                      'page',
                                      'navigationItem',
                                      'path',
                                    ])
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
                                  <ProductIcon icon="Apps" size="medium" color="white" />{' '}
                                  <span>Apps</span> <Icon icon="ArrowDown" color="white" />
                                </div>
                                <Card className={styles.navItem}>
                                  <span className={styles.navItemIcon}>
                                    <ProductIcon icon="Apps" size="small" />{' '}
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
              </div>
            </div>
            <InstanceParameterEditor
              parameters={definition?.parameters?.instance ?? []}
              onChange={(parameters) =>
                onChange({
                  ...definition,
                  parameters: {
                    ...definition.parameters,
                    instance: parameters,
                  },
                })
              }
              errorPath={errorPath}
              errors={errors}
              onErrorsChange={onErrorsChange}
              showWrongLocationNote={
                !definition.locations.some(({ location }) =>
                  [
                    WidgetLocation.ENTRY_EDITOR,
                    WidgetLocation.ENTRY_FIELD,
                    WidgetLocation.ENTRY_SIDEBAR,
                  ].includes(location as WidgetLocation)
                )
              }
              disabled={
                disabled ||
                !definition.locations.some(({ location }) =>
                  [
                    WidgetLocation.ENTRY_EDITOR,
                    WidgetLocation.ENTRY_FIELD,
                    WidgetLocation.ENTRY_SIDEBAR,
                  ].includes(location as WidgetLocation)
                )
              }
            />
          </>
        )}
      </div>
    </>
  );
}
