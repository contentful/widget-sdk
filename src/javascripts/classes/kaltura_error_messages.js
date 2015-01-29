'use strict';

angular.module('contentful').value('KalturaErrorMessages', {
  invalidOrMissingCredentials: 'Can not generate a Kaltura Session Token. Please check your Kaltura credentials',
  invalidEntryId : 'Cannot load the video. Please check the entry id',
  invalidKS      : 'The Kaltura Session is invalid or has expired. Please contact support',
  unknownError   : 'An unexpected error has ocurred. Please contact support'
});

