import React, { Fragment, useState, useMemo } from 'react';
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
import { getRichTextOptions } from './utils/helpers';
import { getIconId } from 'services/fieldFactory';
import { toInternalFieldType } from 'widgets/FieldTypes';
import { create as createBuiltinWidgetList } from 'widgets/BuiltinWidgets';
import { useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { FLAGS } from 'core/feature-flags';
import { useContentTypeField } from './hooks/useContentTypeField';
import { FeedbackButton } from 'core/feature-feedback';
import { styles } from './FieldModalDialogForm.styles';
import {
  ContentType,
  ContentTypeField,
  EditorInterface,
  EditorInterfaceControl,
} from 'core/typings';
import { useFeatureFlag } from 'core/feature-flags';

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

type FieldModalDialogFormProps = {
  ctField: ContentTypeField;
  contentType: ContentType;
  editorInterface: EditorInterface;
  widget: EditorInterfaceControl;

  customWidgets: any[];
  onClose: Function;
  updateFieldOnScope: Function;
};

export function FieldModalDialogForm(props: FieldModalDialogFormProps) {
  const {
    onClose,
    ctField,
    widget,
    contentType,
    updateFieldOnScope,
    editorInterface,
    customWidgets,
  } = props;
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const [selectedTab, setSelectedTab] = useState(formTabs.SETTINGS);
  const [richTextOptions, setRichTextOptions] = useState(() => getRichTextOptions(ctField));
  const [useInitialValues] = useFeatureFlag(FLAGS.INITIAL_FIELD_VALUES);

  const availableWidgets = useMemo(
    () => getAvailableWidgets(customWidgets, contentType, editorInterface, ctField),
    [customWidgets, ctField]
  );

  const submitFn = (values, richTextOptions, widgetSettings) => {
    updateFieldOnScope(values, richTextOptions, widgetSettings);
    onClose();
  };
  const {
    contentType: contentTypeForm,
    widgetSettings,
    isPristine,
    isInvalid,
  } = useContentTypeField({
    submitFn,
    field: ctField,
    contentType,
    widget,
  });
  const { onBlur, onChange, onSubmit, fields } = contentTypeForm;
  const iconId = getIconId(ctField) + '-small';

  return (
    <Fragment>
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
            {useInitialValues && (
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
            onClick={() => onClose()}
            iconProps={{
              icon: 'Close',
            }}
            label="Close modal dialog"
            testId="cf-ui-icon-button"
          />
        </div>
      </div>
      <Modal.Content>
        {selectedTab === formTabs.SETTINGS && (
          <TabPanel id="settings-tab-panel">
            <SettingsTabComponent
              onBlur={onBlur}
              onChange={onChange}
              fields={fields}
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
              ctField={ctField}
              contentTypes={currentSpaceContentTypes}
              widgetSettings={widgetSettings.data}
              availableWidgets={availableWidgets}
            />
          </TabPanel>
        )}
        {useInitialValues && selectedTab === formTabs.INITIAL_VALUE && (
          <TabPanel id="initial-value-tab-panel">
            <InitialValueTabComponent
              onChange={onChange}
              fields={fields}
              ctField={ctField}
              contentType={contentType}
            />
          </TabPanel>
        )}
        {selectedTab === formTabs.APPEARANCE && (
          <TabPanel id="appearance-tab-panel">
            <AppearanceTabComponent
              editorInterface={editorInterface}
              availableWidgets={availableWidgets}
              widgetSettings={widgetSettings.data}
              setWidgetSettings={widgetSettings.setData}
              contentType={contentType}
              ctField={ctField}
            />
          </TabPanel>
        )}
      </Modal.Content>
      <Modal.Controls className={styles.modalControls}>
        <div>
          <Button
            testId="confirm-field-dialog-form"
            disabled={isInvalid || isPristine}
            onClick={() => onSubmit(richTextOptions, widgetSettings.data)}
            buttonType="positive">
            Confirm
          </Button>
          <Button onClick={() => onClose()} buttonType="muted">
            Cancel
          </Button>
        </div>

        {useInitialValues && selectedTab === formTabs.INITIAL_VALUE && (
          <FeedbackButton about="Initial values" target="dante" />
        )}
      </Modal.Controls>
    </Fragment>
  );
}
