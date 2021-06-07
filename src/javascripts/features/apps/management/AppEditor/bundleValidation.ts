import React from 'react';
import {
  ACCEPTED_ENTRY_FILES,
  ABSOLUTE_PATH_REG_EXP,
  UI_BUNDLE_ERRORS,
  UI_BUNDLE_WARNINGS,
} from './constants';
import { captureError } from 'core/monitoring';

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

interface ValidationError {
  type: 'error';
  message: 'string';
}
interface ValidationWarning {
  type: 'warning';
  message: React.ReactNode;
}
export const validateBundle = async (
  files
): Promise<ValidationError | ValidationWarning | null> => {
  try {
    if (files.length < 1) {
      return { type: 'error', message: UI_BUNDLE_ERRORS.EMPTY } as ValidationError;
    }
    // file is zip file
    if (files.length !== 1 || files[0].type !== 'application/zip') {
      const entryFile = getEntryFile(files);
      if (!entryFile) {
        return { type: 'error', message: UI_BUNDLE_ERRORS.ENTRY_FILE } as ValidationError;
      }
      const hasAbsolutePath = await fileContainsAbsolutePath(entryFile);
      if (hasAbsolutePath) {
        return { type: 'warning', message: UI_BUNDLE_WARNINGS.ABSOLUTE_PATH } as ValidationWarning;
      }
    }
  } catch (e) {
    captureError(e);
    return { type: 'error', message: UI_BUNDLE_ERRORS.UNKNOWN } as ValidationError;
  }

  return null;
};
