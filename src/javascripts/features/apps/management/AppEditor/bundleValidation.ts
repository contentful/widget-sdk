import { ACCEPTED_ENTRY_FILES, ABSOLUTE_PATH_REG_EXP, UI_BUNDLE_ERRORS } from './constants';
import { logException } from 'analytics/Sentry';

// checks the (entry) file if it contains an absolute path. Which is will not work as a bundle upload
export const fileContainsAbsolutePath = async (file: File) => {
  const reader = new FileReader();
  reader.readAsText(file, 'UTF-8');
  const fileContent: string = await new Promise((res) => {
    reader.onload = function (evt) {
      res(evt.target?.result as string);
    };
  });

  return [...fileContent.matchAll(ABSOLUTE_PATH_REG_EXP)].length > 0;
};

export const getEntryFile = (files: File[]) =>
  files.find((file) => ACCEPTED_ENTRY_FILES.includes(file.name));

export const validateBundle = async (files) => {
  try {
    if (files.length < 1) {
      return UI_BUNDLE_ERRORS.EMPTY;
    }
    // file is zip file
    if (files.length !== 1 || files[0].type !== 'application/zip') {
      const entryFile = getEntryFile(files);
      if (!entryFile) {
        return UI_BUNDLE_ERRORS.ENTRY_FILE;
      }
      // const hasAbsolutePath = await fileContainsAbsolutePath(entryFile);
      // if (hasAbsolutePath) {
      //   // TODO do something with the warning (implemented with EXT-2678)
      // }
    }
  } catch (e) {
    logException(e);
    return UI_BUNDLE_ERRORS.UNKNOWN;
  }

  return null;
};
