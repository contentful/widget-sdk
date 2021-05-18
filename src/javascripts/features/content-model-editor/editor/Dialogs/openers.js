import { ModalLauncher } from '@contentful/forma-36-react-components';
import { EditContentTypeDialog } from './EditContentTypeDialog';
import React from 'react';
import { CreateContentTypeDialog } from './CreateContentTypeDialog';
import { DuplicateContentTypeDialog } from './DuplicateContentTypeDialog';

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
          name: (name || '').trim(),
          description: (description || '').trim(),
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
      originalName={contentType.name}
      originalDescription={contentType.description}
      onClose={() => {
        props.onClose(false);
      }}
      onConfirm={({ name, description }) => {
        props.onClose({
          name: (name || '').trim(),
          description: (description || '').trim(),
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
      originalName={contentType.name}
      originalDescription={contentType.description}
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
