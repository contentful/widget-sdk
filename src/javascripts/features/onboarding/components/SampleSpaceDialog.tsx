import React, { useState, useCallback, useEffect } from 'react';
import {
  Button,
  DisplayText,
  Modal,
  Flex,
  Notification,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { track } from 'analytics/Analytics';
import TemplatesList from 'app/SpaceWizards/shared/TemplatesList';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { useAsync } from 'core/hooks/useAsync';
import { LoadingCard } from './LoadingCard';
import { applyTemplateToSpace, SelectedTemplate } from 'features/space-purchase';
import { getSpace } from 'services/TokenStore';
import { SpaceData } from 'core/services/SpaceEnvContext/types';
import { go } from 'states/Navigator';

const styles = {
  container: css({
    maxWidth: 990,
  }),
};

const fetchData = (spaceId) => async () => {
  const templatesList = await getTemplatesList();
  const spaceData = await getSpace(spaceId);
  return { templatesList, spaceData };
};

export const SampleSpaceDialog = ({ onClose, onBack, spaceId }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate>();
  const [space, setSpace] = useState<SpaceData>();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (selectedTemplate && space) {
      track('onboarding_sample_space:continue', {
        templateName: `${selectedTemplate?.name}`,
      });

      setLoading(true);

      try {
        await applyTemplateToSpace(space, selectedTemplate);
      } finally {
        Notification.success('You have successfully created a pre-built space.');
        setLoading(false);
        onClose();
        go({ path: 'spaces.detail.content_types.list' });
      }
    }
  };

  const { isLoading, data } = useAsync(useCallback(fetchData(spaceId), [spaceId]));

  useEffect(() => {
    // if templates are visible, select the first one by default
    if (data?.templatesList && !selectedTemplate) {
      setSelectedTemplate(data?.templatesList[0]);
    }
    setSpace(data?.spaceData);
  }, [selectedTemplate, data]);

  return (
    <Modal.Content className={styles.container}>
      {isLoading && <LoadingCard />}
      {!isLoading && data?.templatesList && (
        <>
          <Flex marginBottom="spacing3Xl">
            <DisplayText>Choose and create a space</DisplayText>
          </Flex>
          <Flex marginBottom="spacing3Xl">
            <TemplatesList
              templates={data?.templatesList}
              selectedTemplate={selectedTemplate}
              onSelect={(template) => setSelectedTemplate(template)}
              isNewSpacePurchaseFlow={true}
            />
          </Flex>
          <Flex justifyContent="flex-end" marginBottom="spacingM">
            <Flex flexDirection="column" marginRight="spacingM">
              <Button
                buttonType="muted"
                onClick={() => {
                  track('onboarding_sample_space:back');
                  onBack();
                }}
                testId="back-btn">
                Back
              </Button>
            </Flex>
            <Flex>
              <Button
                buttonType="primary"
                loading={loading}
                disabled={!selectedTemplate}
                onClick={handleContinue}
                testId="continue-btn">
                Continue
              </Button>
            </Flex>
          </Flex>
        </>
      )}
    </Modal.Content>
  );
};
