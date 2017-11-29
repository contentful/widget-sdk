# Change Log
All notable changes to this project will be documented in this file.

## v14.1.0 - 2016-11-28
### Added
- `getPublishedContentTypes()` does now accept a query parameter.

## v14.0.1 - 2016-02-03
### Changed
- Publishing a Content Type after the published version has been marked deleted
  removes the deleted mark from the published Content Type.

## v14.0.0 - 2015-11-24
### Changed
- Move package to npmjs.org

### Removed
- Removed queryEntries and queryAsset methods

## v13.1.0 - 2015-09-08
### Added
- `entity.publish()` publishes the current version if no argument is
  given

## v13.0.0 - 2015-06-08
### Changed
- Time metadata methods on Entities return ISO strings

## v12.4.0 - 2015-06-08
### Added
- Publicly expose constructors for all Entity Classes

## v12.3.0 - 2015-05-21
- Add CRUD for Locales.
- Simplify publish method internals for ContentType

## v12.2.0 - 2015-04-16
- Update data properly on api key regeneration

## v12.1.0 - 2015-03-26
- Changed the behavior of canPublish for ContentType. See the [commit](https://github.com/contentful/client/commit/0b60f27f257d8a0a04c89c3d29a77dc93730915d) for more details.
- Fixed a bug in the isDeleted method where it wouldn't consider the
  presence of a deletedAtVersion property
- The previous bug also caused the wrong version to be returned for
  entities in a deleted state

## 12.0.0
### Added
- `npm test` runs JSHint
- Change log is now keepachangelog compatible
- Use babel instad of 6to5
- Test node v0.12 on Travis
- Extend ContentType with publish methods
- Content type canPublish is now only true if the content type has fields
- Clean up and refactor tests

### Removed
- Remove `_baseRequest` property from client.

## 11.0.3
### Added
- Missing X-Contentful-Version header for setUIConfig

## 11.0.2
### Added
- Method to retrieve the last published state

### Changed
- Fix webkit error and making .jshintrc stricter

## 11.0.1
### Changed
- Avoid crash in ContentType#getName when data is null

## 11.0.0
### Added
- New interface for adapter that facilitates adding plugging in
  backend.

### Changed
- Resources (Entities) are instantiated, without persisting them,
  through `parent.newEntry`. Before, this method was called
  `createBlankEntity` or `wrapSpace`.
- `resource.save()` always sends a POST request when the resource
  does't have an id.
- Never update or create the `sys` object. Always get it from the
  server.
- Move `newEditingInterace` and `createEditingInterface` methods to
  `ContentType` resource.

### Removed
- Remove unused testing and JQuery adapters.
