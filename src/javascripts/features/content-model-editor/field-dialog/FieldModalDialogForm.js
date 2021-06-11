import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
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
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { useContentTypeField } from './hooks/useContentTypeField';

const styles = {
  modalControls: css({
    backgroundColor: tokens.colorWhite,
    borderTop: `1px solid ${tokens.colorElementMid}`,
    paddingTop: tokens.spacingL,
    position: 'relative',
    width: '100%',
  }),
  modalHeader: css({
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colorElementLightest,
    borderRadius: `${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0 0 `,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: `${tokens.spacingXs} ${tokens.spacingM} 0 ${tokens.spacingL}`,
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
  const { onBlur, onChange, onSubmit, fields, form } = contentTypeForm;
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
              widgetSettings={widgetSettings.data}
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
              widgetSettings={widgetSettings.data}
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
              widgetSettings={widgetSettings.data}
              setWidgetSettings={widgetSettings.setData}
              contentType={contentType}
              ctField={ctField}
              widget={widget}
            />
          </TabPanel>
        )}
      </Modal.Content>
      <Modal.Controls className={styles.modalControls}>
        <Button
          testId="confirm-field-dialog-form"
          disabled={isInvalid || isPristine}
          onClick={() => onSubmit(richTextOptions, widgetSettings.data)}
          buttonType="positive">
          Confirm
        </Button>
        <Button onClick={onClose} buttonType="muted">
          Cancel
        </Button>
      </Modal.Controls>
    </Fragment>
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
