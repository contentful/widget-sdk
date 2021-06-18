import React, { Fragment, useCallback, useMemo, useState } from 'react';
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
import { InitialValueTabComponent } from './components/initialValue';
import { AppearanceTabComponent } from './components/AppearanceTabComponent';
import { getRichTextOptions } from './utils/helpers';
import { getIconId } from 'services/fieldFactory';
import { FLAGS } from 'core/feature-flags';
import { FeedbackButton } from 'core/feature-feedback';
import { styles } from './FieldModalDialogForm.styles';

import { useFeatureFlag } from 'core/feature-flags';
import {
  ContentType,
  ContentTypeField,
  EditorInterface,
  EditorInterfaceControl,
} from 'core/typings';
import { useContentTypeFieldForm } from './useContentTypeFieldForm';
import { useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { toInternalFieldType } from 'widgets/FieldTypes';
import { create as createBuiltinWidgetList } from 'widgets/BuiltinWidgets';
import { LegacyWidget } from 'widgets/WidgetCompat';

const formTabs = {
  SETTINGS: 'settings-tab',
  VALIDATION: 'validation-tab',
  INITIAL_VALUE: 'initial-values-tab',
  APPEARANCE: 'appearance-tab',
};

const FieldIcon = ({ field }: { field: ContentTypeField }) => (
  <Icon name={getIconId(field) + '-small'} />
);

type FieldModalDialogFormProps = {
  field: ContentTypeField;
  contentType: ContentType;
  editorInterface: EditorInterface;
  widget: EditorInterfaceControl;
  customWidgets: LegacyWidget[];
  onClose: Function;
  updateField: Function;
};

const getAvailableWidgets = (customWidgets, contentType, editorInterface, ctField) => {
  const fieldType = toInternalFieldType(ctField);
  return [...createBuiltinWidgetList({ contentType, editorInterface }), ...customWidgets].filter(
    (widget) => widget.fieldTypes && widget.fieldTypes.includes(fieldType)
  );
};

export function FieldModalDialogForm(props: FieldModalDialogFormProps) {
  const { onClose, customWidgets } = props;
  const { currentSpaceContentTypes: contentTypes } = useSpaceEnvContentTypes();
  const {
    fields,
    contentType,
    field,
    editorInterface,
    widget,
    widgetSettings,
    setValue,
    blur,
    submit,
    isInvalid,
    isPristine,
  } = useContentTypeFieldForm({
    contentType: props.contentType,
    field: props.field,
    editorInterface: props.editorInterface,
    widget: props.widget,
    updateField: props.updateField,
    onClose: props.onClose,
  });
  // TODO can be injected
  const isNewContentType = useMemo(
    () => contentTypes.some((ct) => ct.sys.id === contentType.sys.id),
    [contentTypes, contentType]
  );

  const availableWidgets = useMemo(
    () => getAvailableWidgets(customWidgets, contentType, editorInterface, field),
    [customWidgets, field]
  );

  const [selectedTab, setSelectedTab] = useState(formTabs.SETTINGS);
  const [richTextOptions, setRichTextOptions] = useState(() => getRichTextOptions(field));
  const [useInitialValues] = useFeatureFlag(FLAGS.INITIAL_FIELD_VALUES);
  const blurContentTypeField = useCallback(
    (fieldName: string) => blur('content_type', fieldName),
    [blur]
  );
  const changeContentTypeValue = useCallback(
    (fieldName: string, value: any) => setValue('content_type', fieldName, value),
    [setValue]
  );
  const changeEditorInterfaceValue = useCallback(
    (value: any) => setValue('editor_interface', '', value),
    [setValue]
  );

  return (
    <Fragment>
      <div className={styles.modalHeader}>
        <div className={styles.modalTitle}>
          <FieldIcon field={field} />
          <Heading className={styles.ctFieldTitle}>{field.name}</Heading>
          <DisplayText className={styles.ctFieldType}>{field.type}</DisplayText>
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
              onBlur={blurContentTypeField}
              onChange={changeContentTypeValue}
              fields={fields}
              ctField={field}
              isNewContentType={isNewContentType}
              richTextOptions={richTextOptions}
              setRichTextOptions={setRichTextOptions}
            />
          </TabPanel>
        )}
        {selectedTab === formTabs.VALIDATION && (
          <TabPanel id="validation-tab-panel">
            <ValidationTabComponent
              onBlur={blurContentTypeField}
              onChange={changeContentTypeValue}
              fields={fields}
              ctField={field}
              contentTypes={contentTypes}
              widgetSettings={widgetSettings}
              availableWidgets={availableWidgets}
            />
          </TabPanel>
        )}
        {useInitialValues && selectedTab === formTabs.INITIAL_VALUE && (
          <TabPanel id="initial-value-tab-panel">
            <InitialValueTabComponent
              onChange={changeContentTypeValue}
              contentType={contentType}
              ctField={field}
              widget={widget}
              fields={fields}
            />
          </TabPanel>
        )}
        {selectedTab === formTabs.APPEARANCE && (
          <TabPanel id="appearance-tab-panel">
            <AppearanceTabComponent
              editorInterface={editorInterface}
              availableWidgets={availableWidgets}
              widgetSettings={widgetSettings}
              setWidgetSettings={changeEditorInterfaceValue}
              contentType={contentType}
              ctField={field}
            />
          </TabPanel>
        )}
      </Modal.Content>
      <Modal.Controls className={styles.modalControls}>
        <div>
          <Button
            testId="confirm-field-dialog-form"
            disabled={isInvalid || isPristine}
            onClick={() => submit(richTextOptions, widgetSettings)}
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
