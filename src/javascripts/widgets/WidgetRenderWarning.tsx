import React from 'react';
import { Note, TextLink, Paragraph } from '@contentful/forma-36-react-components';
import * as accessChecker from 'access_control/AccessChecker';
import { track } from '../analytics/Analytics';

import { Control } from './WidgetRenderable';

import { getSpaceContext } from '../classes/spaceContext';
import { getUser } from '../services/TokenStore';
import { getOrg } from '../states/deeplink/utils';

interface WidgetRenderWarningProps {
  message: string;
  widget: Control;
  setRenderFallback: (val: boolean) => void;
}

export default function WidgetRenderWarning(props: WidgetRenderWarningProps) {
  const { message, widget } = props;
  const canUpdateContentTypes = !accessChecker.shouldHide('update', 'contentType');

  let title = '';

  if (message === 'incompatible') {
    title = 'The selected widget cannot be used with this field.';
  } else if (message === 'missing') {
    title = 'The selected widget does not exist anymore.';
  } else if (message === 'internal_error') {
    title = 'App failed to load';
  }

  let noteBody = '';

  if (message === 'internal_error') {
    noteBody =
      'the app could not be loaded. Refresh this page to try again or use the default field editor to make immediate changes.';
  } else if (canUpdateContentTypes) {
    noteBody = 'Please select a valid widget in the Content Model section.';
  } else {
    noteBody =
      'Please contact your Contenful administrator to update the settings in the Content Model section.';
  }

  const getEventData = React.useCallback(async () => {
    const [{ orgId }, currentUser] = await Promise.all([getOrg(), getUser()]);
    const spaceContext = getSpaceContext();
    return {
      appDefinitionId: widget.widgetId,
      organizationId: orgId,
      spaceId: spaceContext.getId(),
      environment: spaceContext.getEnvironmentId(),
      userId: currentUser.sys.id,
    };
  }, [widget.widgetId]);

  React.useEffect(() => {
    const trackWarningShown = async () => {
      const data = await getEventData();
      track('widget_renderer:fallback_warning_shown', {
        data,
      });
    };
    if (message === 'internal_error') {
      trackWarningShown();
    }
  }, [message, getEventData]);

  const onCTAClick = async () => {
    props.setRenderFallback(true);
    const data = await getEventData();
    track('widget_renderer:fallback_rendered', {
      data,
    });
  };

  return (
    <Note noteType="warning" title={title}>
      <Paragraph data-test-id="widget-renderer-warning">{noteBody}</Paragraph>
      {message === 'internal_error' && (
        <TextLink onClick={onCTAClick}>Use default field editor this time</TextLink>
      )}
    </Note>
  );
}
