import React from 'react';
import { ModalLauncher } from 'core/components/ModalLauncher';
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
      onConfirm={({ contentTypeId, name, description }) => {
        props.onClose({
          contentTypeId,
          name,
          description,
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
      onClose={() => {
        props.onClose(false);
      }}
      onConfirm={({ name, description }) => {
        props.onClose({ name, description });
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
