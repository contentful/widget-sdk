import React, { useState, useMemo } from 'react';
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
} from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import { SettingsTabComponent } from './components/SettingsTabComponent';
import { ValidationTabComponent } from './components/ValidationTabComponent';
import { AppearanceTabComponent } from './components/AppearanceTabComponent';
import {
  getSettingsFormFields,
  getValidationsFormFields,
  getNodeValidationsFormFields,
} from './utils/formFieldDefetitions';
import { getRichTextOptions, getWidgetSettings } from './utils/helpers';
import { getIconId } from 'services/fieldFactory';
import { toInternalFieldType } from 'widgets/FieldTypes';
import { create as createBuiltinWidgetList } from 'widgets/BuiltinWidgets';
import { useContentTypes } from 'core/services/SpaceEnvContext';

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
};

const formTabs = {
  SETTINGS: 'settings-tab',
  VALIDATION: 'validation-tab',
  APPEARANCE: 'appearance-tab',
};

const getAvailableWidgets = (customWidgets, ctField) => {
  const fieldType = toInternalFieldType(ctField);
  return [...createBuiltinWidgetList(), ...customWidgets].filter(
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
  const { currentSpaceContentTypes } = useContentTypes();
  const [selectedTab, setSelectedTab] = useState(formTabs.SETTINGS);
  const [richTextOptions, setRichTextOptions] = useState(() => getRichTextOptions(ctField));
  const [widgetSettings, setWidgetSettings] = useState(() => getWidgetSettings(widget));

  const availableWidgets = useMemo(() => getAvailableWidgets(customWidgets, ctField), [
    customWidgets,
    ctField,
  ]);

  const submitForm = (values, richTextOptions, widgetSettings) => {
    updateFieldOnScope(values, richTextOptions, widgetSettings);
    onClose();
  };

  const { onBlur, onChange, onSubmit, fields, form } = useForm({
    fields: {
      ...getSettingsFormFields(ctField, contentType),
      ...getValidationsFormFields(ctField),
      ...getNodeValidationsFormFields(ctField),
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
          testId="save-field-dialog-form"
          disabled={form.invalid}
          onClick={() => onSubmit(richTextOptions, widgetSettings)}
          buttonType="positive">
          Save
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
