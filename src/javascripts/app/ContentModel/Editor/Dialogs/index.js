import React from 'react';
import isNil from 'lodash/isNil';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import { DuplicateContentTypeDialog } from './DuplicateContentTypeDialog';
import { CreateContentTypeDialog } from './CreateContentTypeDialog';
import EditContentTypeDialog from './EditContentTypeDialog';

export function openCreateContentTypeDialog(contentTypeIds) {
  // every time open modal with clean state
  const modalKey = Date.now();
  return ModalLauncher.open((props) => (
    <CreateContentTypeDialog
      key={modalKey}
      isShown={props.isShown}
      existingContentTypeIds={contentTypeIds}
      onCancel={() => {
        props.onClose(false);
      }}
      onConfirm={({ contentTypeId, name, description, assembly }) => {
        props.onClose({
          contentTypeId,
          name,
          description,
          ...(assembly && { assembly }),
        });
      }}
    />
  ));
}

export function openEditContentTypeDialog(contentType) {
  // every time open modal with clean state
  const modalKey = Date.now();
  return ModalLauncher.open((props) => (
    <EditContentTypeDialog
      key={modalKey}
      isShown={props.isShown}
      originalName={contentType.data.name}
      originalDescription={contentType.data.description}
      originalAssembly={contentType.data.assembly}
      onClose={() => {
        props.onClose(false);
      }}
      onConfirm={({ assembly, name, description }) => {
        props.onClose({
          ...(!isNil(assembly) && { assembly }),
          name,
          description,
        });
      }}
    />
  ));
}

export const openDuplicateContentTypeDialog = async (contentType, duplicate, contentTypeIds) => {
  // every time open modal with clean state
  const modalKey = Date.now();
  return ModalLauncher.open((props) => (
    <DuplicateContentTypeDialog
      key={modalKey}
      isShown={props.isShown}
      originalName={contentType.data.name}
      originalDescription={contentType.data.description}
      existingContentTypeIds={contentTypeIds}
      onCancel={() => {
        props.onClose(false);
      }}
      onConfirm={({ contentTypeId, name, description }) => {
        return duplicate({ contentTypeId, name, description }).then((duplicated) => {
          props.onClose(duplicated);
        });
      }}
    />
  ));
};
