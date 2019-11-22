import { getModule } from 'NgRegistry';
import * as Fetcher from 'app/settings/extensions/dialogs/ExtensionFetcher';
import * as stringUtils from 'utils/StringUtils';
import { getEntryConfiguration } from 'app/EntrySidebar/Configuration/defaults';

import {
  createContentTypeConfig,
  createEditorControlsConfig,
  createEditorSidebarConfig
} from './ContentTypeConfig';
import { EXTENSIONS } from './Constants';

class InstallationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InstallationError';
  }
}

const raiseInstallationError = message => {
  return e => Promise.reject(new InstallationError(message + ': ' + e.message));
};

const installExtension = async ({ url, name }) => {
  const spaceContext = getModule('spaceContext');

  const extensionData = await Fetcher.fetchExtension(url).catch(
    raiseInstallationError(`Failed to load extension ${name} from ${url}`)
  );

  extensionData.name = name;

  return spaceContext.cma
    .createExtension({
      extension: extensionData
    })
    .catch(raiseInstallationError(`Failed to install extension ${name} on space`));
};

const createContentType = async name => {
  const spaceContext = getModule('spaceContext');

  const existingContentTypes = await spaceContext.publishedCTs.getAllBare();
  let contentTypeId = stringUtils.toIdentifier(name);

  if (existingContentTypes.some(ct => ct.sys.id === contentTypeId)) {
    contentTypeId = null;
  }

  const contentType = await spaceContext.cma
    .createContentType(createContentTypeConfig(name, contentTypeId))
    .catch(raiseInstallationError(`Failed to create content type ${name} in space`));

  await spaceContext.cma
    .publishContentType(contentType)
    .catch(raiseInstallationError(`Failed to publish content type ${name}`));

  return contentType;
};

const addExtensionsToEditorInterface = async (
  contentType,
  imageUploaderExtensionId,
  imageTaggingExtensionId
) => {
  const spaceContext = getModule('spaceContext');

  const editorInterface = await spaceContext.cma
    .getEditorInterface(contentType.sys.id)
    .catch(raiseInstallationError(`Failed to load editor interface for ${contentType.name}`));

  editorInterface.controls = createEditorControlsConfig(imageUploaderExtensionId);

  if (imageTaggingExtensionId) {
    const defaultWidgets = await getEntryConfiguration();
    editorInterface.sidebar = createEditorSidebarConfig(imageTaggingExtensionId, defaultWidgets);
  }

  await spaceContext.cma
    .updateEditorInterface(editorInterface)
    .catch(raiseInstallationError(`Failed to update editor interface for ${contentType.name}`));
};

export const installApp = async wrapperName => {
  const spaceContext = getModule('spaceContext');

  const [imageTaggingExtension, imageUploaderExtension, contentType] = await Promise.all([
    installExtension(EXTENSIONS.imageTagging),
    installExtension(EXTENSIONS.imageUploader),
    createContentType(wrapperName)
  ]);

  const imageTaggingExtensionId = imageTaggingExtension.sys.id;
  const imageUploaderExtensionId = imageUploaderExtension.sys.id;

  await addExtensionsToEditorInterface(
    contentType,
    imageUploaderExtensionId,
    imageTaggingExtensionId
  );

  await spaceContext.publishedCTs.refresh();

  return {
    contentTypeId: contentType.sys.id,
    contentTypeName: wrapperName,
    imageTaggingExtensionId: imageTaggingExtensionId,
    imageUploaderExtensionId: imageUploaderExtensionId
  };
};

const deleteExtension = id => {
  const spaceContext = getModule('spaceContext');

  if (id) {
    return spaceContext.cma.deleteExtension(id);
  }

  return Promise.resolve();
};

const removeExtensionsFromEditorInterface = async config => {
  const spaceContext = getModule('spaceContext');

  const editorInterface = await spaceContext.cma.getEditorInterface(config.contentTypeId);

  editorInterface.sidebar = editorInterface.sidebar.filter(
    s => s.widgetId !== config.imageTaggingExtensionId
  );

  const imageControl = editorInterface.controls.find(
    c => c.widgetId === config.imageUploaderExtensionId
  );

  if (imageControl) {
    imageControl.widgetId = 'assetLinkEditor';
    imageControl.widgetNamespace = 'builtin';
  }

  await spaceContext.cma.updateEditorInterface(editorInterface);
};

export const uninstallApp = async appConfig => {
  const spaceContext = getModule('spaceContext');

  const config = appConfig.config || {};

  await Promise.all([
    deleteExtension(config.imageTaggingExtensionId),
    deleteExtension(config.imageUploaderExtensionId),
    removeExtensionsFromEditorInterface(config)
  ]);

  return spaceContext.publishedCTs.refresh();
};