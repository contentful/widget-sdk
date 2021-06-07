import React, { useEffect, useState, useMemo } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { useForm } from 'core/hooks/useForm';
import {
  Modal,
  Button,
  Tabs,
  Tab,
  TabPanel,
  Heading,
  DisplayText,
  IconButton,
  Tag,
} from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import { SettingsTabComponent } from './components/SettingsTabComponent';
import { ValidationTabComponent } from './components/ValidationTabComponent';
import { InitialValueTabComponent } from './components/InitialValueTabComponent';
import { AppearanceTabComponent } from './components/AppearanceTabComponent';
import {
  getSettingsFormFields,
  getValidationsFormFields,
  getNodeValidationsFormFields,
  getInitialValueFormFields,
} from './utils/formFieldDefinitions';
import { getRichTextOptions, getWidgetSettings } from './utils/helpers';
import { getIconId } from 'services/fieldFactory';
import { toInternalFieldType } from 'widgets/FieldTypes';
import { create as createBuiltinWidgetList } from 'widgets/BuiltinWidgets';
import { useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { FLAGS, getVariation } from 'LaunchDarkly';

const styles = {
  modalHeader: css({
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colorElementLightest,
    borderRadius: '3px 3px 0 0',
    borderBottom: `1px solid ${tokens.colorElementDark}`,
    padding: `${tokens.spacingXs} ${tokens.spacingL} 0 ${tokens.spacingL}`,
  }),
  leftPanel: css({
    display: 'flex',
  }),
  modalTitle: css({
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  }),
  ctFieldTitle: css({
    fontSize: tokens.fontSizeL,
    paddingRight: tokens.spacingXs,
    paddingLeft: tokens.spacingXs,
  }),
  ctFieldType: css({
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.colorTextLightest,
  }),
  promotionTag: css({
    marginLeft: tokens.spacingXs,
  }),
};

const formTabs = {
  SETTINGS: 'settings-tab',
  VALIDATION: 'validation-tab',
  INITIAL_VALUE: 'initial-values-tab',
  APPEARANCE: 'appearance-tab',
};

const getAvailableWidgets = (customWidgets, contentType, editorInterface, ctField) => {
  const fieldType = toInternalFieldType(ctField);
  return [...createBuiltinWidgetList({ contentType, editorInterface }), ...customWidgets].filter(
    (widget) => widget.fieldTypes && widget.fieldTypes.includes(fieldType)
  );
};

const FieldModalDialogForm = ({
  onClose,
  ctField,
  widget,
  contentType,
  updateFieldOnScope,
  editorInterface,
  customWidgets,
}) => {
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const { currentOrganizationId, currentSpaceId } = useSpaceEnvContext();
  const [selectedTab, setSelectedTab] = useState(formTabs.SETTINGS);
  const [richTextOptions, setRichTextOptions] = useState(() => getRichTextOptions(ctField));
  const [widgetSettings, setWidgetSettings] = useState(() => getWidgetSettings(widget));
  const [isInitialFieldValuesEnabled, setIsInitialFieldValuesEnabled] = useState(false);

  useEffect(() => {
    const getInitialFieldValuesFeatureFlagVariation = async () => {
      const featureFlagVariation = getVariation(FLAGS.INITIAL_FIELD_VALUES, {
        organizationId: currentOrganizationId,
        spaceId: currentSpaceId,
      });

      setIsInitialFieldValuesEnabled(featureFlagVariation);
    };

    getInitialFieldValuesFeatureFlagVariation();
  }, [currentOrganizationId, currentSpaceId]);

  const availableWidgets = useMemo(
    () => getAvailableWidgets(customWidgets, contentType, editorInterface, ctField),
    [customWidgets, ctField]
  );

  const submitForm = (values, richTextOptions, widgetSettings) => {
    updateFieldOnScope(values, richTextOptions, widgetSettings);
    onClose();
  };

  const { onBlur, onChange, onSubmit, fields, form } = useForm({
    fields: {
      ...getSettingsFormFields(ctField, contentType),
      ...getValidationsFormFields(ctField),
      ...getNodeValidationsFormFields(ctField),
      ...getInitialValueFormFields(ctField),
    },
    submitFn: submitForm,
  });

  const iconId = getIconId(ctField) + '-small';

  return (
    <div data-test-id="field-dialog">
      <div className={styles.modalHeader}>
        <div className={styles.modalTitle}>
          <Icon name={iconId} />
          <Heading className={styles.ctFieldTitle}>{ctField.name}</Heading>
          <DisplayText className={styles.ctFieldType}>{ctField.type}</DisplayText>
        </div>
        <div className={styles.leftPanel}>
          <Tabs>
            <Tab
              testId={formTabs.SETTINGS}
              id={formTabs.SETTINGS}
              selected={selectedTab === formTabs.SETTINGS}
              onSelect={setSelectedTab}>
              Settings
            </Tab>
            <Tab
              testId={formTabs.VALIDATION}
              id={formTabs.VALIDATION}
              selected={selectedTab === formTabs.VALIDATION}
              onSelect={setSelectedTab}>
              Validation
            </Tab>
            {isInitialFieldValuesEnabled && (
              <Tab
                testId={formTabs.INITIAL_VALUE}
                id={formTabs.INITIAL_VALUE}
                selected={selectedTab === formTabs.INITIAL_VALUE}
                onSelect={setSelectedTab}>
                Initial value
                <Tag className={styles.promotionTag} tagType="primary-filled" size="small">
                  new
                </Tag>
              </Tab>
            )}
            <Tab
              testId={formTabs.APPEARANCE}
              id={formTabs.APPEARANCE}
              selected={selectedTab === formTabs.APPEARANCE}
              onSelect={setSelectedTab}>
              Appearance
            </Tab>
          </Tabs>
          <IconButton
            buttonType="muted"
            onClick={onClose}
            iconProps={{
              icon: 'Close',
            }}
            label="Close modal dialog"
            testId="cf-ui-icon-button"
          />
        </div>
      </div>
      <Modal.Content>
        <div>
          {selectedTab === formTabs.SETTINGS && (
            <TabPanel id="settings-tab-panel">
              <SettingsTabComponent
                onBlur={onBlur}
                onChange={onChange}
                fields={fields}
                form={form}
                ctField={ctField}
                contentTypes={currentSpaceContentTypes}
                contentType={contentType}
                richTextOptions={richTextOptions}
                setRichTextOptions={setRichTextOptions}
              />
            </TabPanel>
          )}
          {selectedTab === formTabs.VALIDATION && (
            <TabPanel id="validation-tab-panel">
              <ValidationTabComponent
                onBlur={onBlur}
                onChange={onChange}
                fields={fields}
                form={form}
                ctField={ctField}
                contentTypes={currentSpaceContentTypes}
                widgetSettings={widgetSettings}
                availableWidgets={availableWidgets}
              />
            </TabPanel>
          )}
          {isInitialFieldValuesEnabled && selectedTab === formTabs.INITIAL_VALUE && (
            <TabPanel id="initial-value-tab-panel">
              <InitialValueTabComponent
                onBlur={onBlur}
                onChange={onChange}
                fields={fields}
                ctField={ctField}
                contentType={contentType}
                contentTypes={currentSpaceContentTypes}
                editorInterface={editorInterface}
                widgetSettings={widgetSettings}
                availableWidgets={availableWidgets}
              />
            </TabPanel>
          )}
          {selectedTab === formTabs.APPEARANCE && (
            <TabPanel id="appearance-tab-panel">
              <AppearanceTabComponent
                editorInterface={editorInterface}
                customWidgets={customWidgets}
                availableWidgets={availableWidgets}
                widgetSettings={widgetSettings}
                setWidgetSettings={setWidgetSettings}
                contentType={contentType}
                ctField={ctField}
                widget={widget}
              />
            </TabPanel>
          )}
        </div>
      </Modal.Content>
      <Modal.Controls>
        <Button
          testId="confirm-field-dialog-form"
          disabled={form.invalid}
          onClick={() => onSubmit(richTextOptions, widgetSettings)}
          buttonType="positive">
          Confirm
        </Button>
        <Button onClick={onClose} buttonType="muted">
          Cancel
        </Button>
      </Modal.Controls>
    </div>
  );
};

FieldModalDialogForm.propTypes = {
  editorInterface: PropTypes.object.isRequired,
  customWidgets: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  ctField: PropTypes.object,
  widget: PropTypes.object,
  contentType: PropTypes.object.isRequired,
  updateFieldOnScope: PropTypes.func.isRequired,
};

export { FieldModalDialogForm };
