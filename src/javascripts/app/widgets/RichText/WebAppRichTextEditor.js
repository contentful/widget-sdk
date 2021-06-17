/* eslint-disable react/prop-types */
import React from 'react';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { RichTextEditor as RichTextEditorNext } from '@contentful/field-editor-rich-text-next';
import { rtSdkDecorator } from './rtSdkDecorator';
import withTracking from './withTracking';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { getVariation, getVariationSync, FLAGS } from 'core/feature-flags';

/**
 * Renders the RichTextEditor in the context of the web-app set-up with all dependencies.
 *
 * @param {Object} sdk
 * @param {Object} loadEvents
 * @returns {React.Element}
 */
export default function RenderRichTextEditor({ sdk, loadEvents }) {
  const { currentSpace, currentOrganizationId, currentSpaceId, currentEnvironmentId } =
    useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  // RichTextEditor relies on some non-default widgetApi APIs that are not (yet) open sourced in
  // the ui-extensions-sdk.
  const richTextSdk = rtSdkDecorator(sdk, isMasterEnvironment);

  const ldParams = React.useMemo(
    () => ({
      organizationId: currentOrganizationId,
      spaceId: currentSpaceId,
      environmentId: currentEnvironmentId,
    }),
    [currentOrganizationId, currentSpaceId, currentEnvironmentId]
  );

  const [useRichTextNext, setUseRichTextNext] = React.useState(() =>
    getVariationSync(FLAGS.RICH_TEXT_TABLES, ldParams)
  );

  React.useEffect(() => {
    const getFlagAndSetUseRichTextNext = async () => {
      const shouldUseRichTextNext = await getVariation(FLAGS.RICH_TEXT_TABLES, ldParams);
      setUseRichTextNext(shouldUseRichTextNext);
    };
    getFlagAndSetUseRichTextNext();
  }, [ldParams]);

  const RichTextEditorWithTracking = React.useMemo(
    () => withTracking(useRichTextNext ? RichTextEditorNext : RichTextEditor),
    [useRichTextNext]
  );

  return (
    <RichTextEditorWithTracking
      sdk={richTextSdk}
      loadEvents={loadEvents} // specific to withTracking
    />
  );
}
