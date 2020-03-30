# `generic` events with `scope: "sharejs"`

## `sharejs:cma_entity_version_mismatch`
ShareJS has some documents that are out of sync with the index held in the CMA.
We want to log these to be able to repair them and analyze.

### Schema
 - `scope: "sharejs"`
 - `action: "cma_entity_version_mismatch"`
 - `entityId: {string}`
 - `entityType: "Asset" | "Entry"`
 - `cmaEntityVersion: {number}`  
The `entity.sys.version` on the entity received via CMA.
 - `shareJsDocVersion: {number}`  
The ShareJS document version. Might be a lower or higher number than the actual entity version equivalent on new or compressed documents. `shareJsDocCompressedVersion` needs to be added.
 - `shareJsDocCompressedVersion: {number|null}`  
Seems to be `-1` for new entities. Can be `0` and seems to be a positive number on compressed ShareJS documents. `shareJsDocVersion + shareJsDocCompressedVersion` should alwAys equal or be higher than `cmaEntityVersion`, otherwise this event is being tracked.

### Change log
This information was originally [logged to Bugsnag](https://app.bugsnag.com/contentful/user-interface/errors/5a1dc0e4a29eb5001927066f) which made less sense as these
cases are not necessarily considered a web-app bug.
