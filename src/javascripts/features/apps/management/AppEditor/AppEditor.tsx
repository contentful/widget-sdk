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
import { cloneDeep, isEqual, noop } from 'lodash';
import React from 'react';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { toApiFieldType, toInternalFieldType } from 'widgets/FieldTypes';
import { ConditionalValidationMessage } from './ConditionalValidationMessage';
import { FIELD_TYPES_ORDER, LOCATION_ORDER } from './constants';
import { InstanceParameterEditor } from './InstanceParameterEditor';
import { styles } from './styles';
import { ValidationError } from './types';
import { AppLocation, FieldType } from 'contentful-management/types';
import { AppDefinitionWithBundle, AppHosting } from './AppHosting';
import { AppDetailsStateContext } from '../AppDetails/AppDetailsStateContext';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

export interface AppEditorProps {
  errorPath?: string[];
  errors?: ValidationError[];
  onErrorsChange?: (errors: ValidationError[]) => void;
  disabled: boolean;
}

type DefinitionWithLocations = Exclude<AppDefinitionWithBundle, 'locations'> & {
  locations: AppLocation[];
};

const hasLocations = (definition: AppDefinitionWithBundle): definition is DefinitionWithLocations =>
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
  errorPath = [],
  errors = [],
  onErrorsChange = noop,
  disabled,
}: AppEditorProps) {
  const { draftDefinition, setDraftDefinition } = React.useContext(AppDetailsStateContext);

  draftDefinition.locations = draftDefinition.locations || [];
  if (!hasLocations(draftDefinition)) {
    throw new Error('App Definition had no locations in App Editor');
  }

  const clearErrorForField = (path: string[]) => {
    onErrorsChange(errors.filter((error) => !isEqual(error.path, path)));
  };

  const getLocationIndex = (locationValue) => {
    return draftDefinition.locations.findIndex(({ location }) => {
      return location === locationValue;
    });
  };

  const getLocation = (locationValue) => draftDefinition.locations[getLocationIndex(locationValue)];
  const hasLocation = (locationValue) => !!getLocation(locationValue);

  const toggleLocation = (locationValue) => {
    const updated = cloneDeep(draftDefinition);

    if (hasLocation(locationValue)) {
      updated.locations = updated.locations.filter(({ location }) => {
        return location !== locationValue;
      });
    } else {
      updated.locations = draftDefinition.locations.concat([{ location: locationValue }]);
    }

    setDraftDefinition(updated);
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
    const updated = cloneDeep(draftDefinition);
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

    setDraftDefinition(updated);
  };

  const getNavigationItemValue = (field: 'name' | 'path'): string => {
    const pageLocation = getLocation(WidgetLocation.PAGE);

    if (!pageLocation || !isPageLocation(pageLocation) || !pageLocation.navigationItem) {
      return '';
    }

    return pageLocation.navigationItem[field];
  };

  const togglePageLocationData = (): void => {
    const updated = cloneDeep(draftDefinition);
    const pageLocation = updated.locations[getLocationIndex(WidgetLocation.PAGE)];

    if (isPageLocation(pageLocation) && hasNavigation(pageLocation)) {
      delete pageLocation.navigationItem;
    } else {
      (pageLocation as PageLocation).navigationItem = { path: '/', name: draftDefinition.name };
    }

    setDraftDefinition(updated);
  };

  const updatePageLocation = ({
    field,
    value,
  }: {
    field: 'name' | 'path';
    value: string;
  }): void => {
    const updated = cloneDeep(draftDefinition);
    const pageLocation = updated.locations[getLocationIndex(WidgetLocation.PAGE)];
    if (isPageLocation(pageLocation) && hasNavigation(pageLocation)) {
      if (field === 'path' && !value.startsWith('/')) {
        value = `/${value}`;
      }

      pageLocation.navigationItem[field] = value.trim();

      setDraftDefinition(updated);
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
          value={draftDefinition.name || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            clearErrorForField([...errorPath, 'name']);
            setDraftDefinition({ ...draftDefinition, name: e.target.value.trim() });
          }}
          validationMessage={
            errors.find((error) => isEqual(error.path, [...errorPath, 'name']))?.details
          }
          textInputProps={{ disabled }}
        />
        <AppHosting
          disabled={disabled}
          errorPath={errorPath}
          errors={errors}
          clearErrorForField={clearErrorForField}
        />

        {(draftDefinition.src || draftDefinition.bundle) && (
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
                            path={[...errorPath, 'locations', 'entry-field', 'fieldTypes']}
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
                                  placeholder: draftDefinition.name,
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
              parameters={draftDefinition?.parameters?.instance ?? []}
              onChange={(parameters) =>
                setDraftDefinition({
                  ...draftDefinition,
                  parameters: {
                    ...draftDefinition.parameters,
                    instance: parameters,
                  },
                })
              }
              errorPath={errorPath}
              errors={errors}
              onErrorsChange={onErrorsChange}
              showWrongLocationNote={
                !draftDefinition.locations.some(({ location }) =>
                  [
                    WidgetLocation.ENTRY_EDITOR,
                    WidgetLocation.ENTRY_FIELD,
                    WidgetLocation.ENTRY_SIDEBAR,
                  ].includes(location as WidgetLocation)
                )
              }
              disabled={
                disabled ||
                !draftDefinition.locations.some(({ location }) =>
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
