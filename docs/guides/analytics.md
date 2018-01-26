Analytics
=========

This guide explains how we track events occurring in the app and what data
we send to analytical services.

## Analytical services

We send analytics data directly to Snowplow and Segment.

We've migrated away from using Totango and GTM in the direct way. Mixpanel
integration for Segment was disabled as well.

UI enables all integrations for Segment (by not providing "integrations"
configuration option). Thanks to that integration management can be done
solely in the admin panel (of Segment).

The only exception is Intercom integration for `track` method. We forcefully
disable this integration in the app. Our intercom setup doesn't care about
these events and at the same time it has a limit of 120 unique event names.
It caused some unhandled exceptions in the past.

Network communication is performed only in production, staging and preview.
Separate API keys are used for each environment. Majority of tracking code
is also executed in the development mode. In particular events are sent to
an analytics console (see below).

We call Segment's `page` method when state is changed and `identify` method
each time we obtain some more information about a user.

We call Snowplow's `identify` method when we obtain user information.

When we call `analytics.track` we also check if the event name has been mapped
to a registered Snowplow schema. If so, we transform the data into Snowplow's
structure and track the event.

## Tracking in Snowplow
Snowplow requires much more structured data than Segment. Whilst every tracking
event is simply emitted to Segment as-is when you call `analytics.track`, we only
send the event to Snowplow if it's on the list `analytics/snowplow/Events.es6.js`.
Events in Snowplow should be registered here with their corresponding schema and
transformer (a function that takes the event name and data and transforms it to
a format required by Snowplow).

To view or update available schemas, go to the
[schema respository](https://github.com/contentful/com.contentful-schema-registry)
and follow the instructions provided there. If you are creating or updating a
schema you will also need to add the schema or bump the version in the file
`analytics/snowplow/Schemas.es6.js`.

To debug sent events, you can use Kibana for [non-production
environments][kibana-staing] and the [production environment][kibana-production]
In production, data is processed into Redshift every 12 hours where it can be
later checked, e.g. via Looker or Periscope.

[kibana-staging]: http://com-contentful.mini.snplow.net:5601
[kibana-production]: https://search-com-contentful-es-1-bida4oyd7qk6gfsuhokpw3ioge.eu-central-1.es.amazonaws.com/_plugin/kibana

## Analytics console

The analytics console is a simple front-end tool that allows to intercept
and show data sent to Segment. The tool is available only in development,
preview and staging modes.

To open the console open browser's dev tools and invoke a function:

`window.cfDebug.analytics()`


## Event name convention

Anatomy of an event name:

- namespace: only lowercase characters and underscores (snake_case)
- colon
- event name: only lowercase characters and underscores (snake_case)

Namespace should be derived from the location in the app where events are
tracked. Event name should be descriptive 1-5 words in the past tense.


## Adding a new tracking event

Please follow this checklist:

- Firstly, agree with product what event needs to be tracked and how
- Ask if there's value in adding the new event. Remember that analytics code
  clutters the app code and adding new schemas adds complexity to the data model.
  Using the existing page view tracking together with backend events can already
  answer a lot of basic questions about user behavior
- If schemas need to be changed, open a pull request in the
  [Schema repository](https://github.com/contentful/com.contentful-schema-registry)
  and assign to data engineering for review. See
  [the wiki](https://contentful.atlassian.net/wiki/display/ENG/How+to+create+a+snowplow+schema)
  for more detailed instructions
- Come up with an internal / Segment event name - select one of existing namespaces or
  introduce a new one as required
- Add the name to the list of valid event names (`analytics/validEvents`
  constant in `analytics/analytics_validator.js`)
- Add a call to `analytics.track` method
- If computing a payload requires some logic or events can be grouped
  together, introduce a special service for tracking purposes only
  (put this service into `src/javascripts/analytics/events`)
- To send the event to Snowplow as well as Segment, you need to register the event
  in `analytics/snowplow.Events.es6.js` together with the relevant `schema` and
  `transformer`. The schema will be the Snowplow schema to send to from the list
  `analytics/snowplow/Schemas.es6.js`. Transformer is a function that accepts event
  name and data and returns the output sent to Snowplow


## Default payload

Every event by default contains the following data:

- `userId: id-string`
- `spaceId: id-string`
- `organizationId: id-string`
- `currentState: string`

Each event can extend this payload with custom payload. In very rare cases
space/organization ID may not be available (organization/space not created
yet).


## List of events

| namespace           | event name                            | payload
|---------------------|---------------------------------------|---------
| global              | app_loaded                            | -
| global              | space_changed                         | -
| global              | space_left                            | -
| global              | state_changed                         | <code>state: string<br>params: obj<br>fromState: string<br>fromParams: obj</code>
| global              | logout_clicked                        | -
| global              | top_banner_dismissed                  | -
| global              | navigated                             | -
| home                | space_selected                        | -
| home                | space_learn_selected                  | -
| home                | language_selected                     | -
| home                | link_opened                           | -
| home                | command_copied                        | -
| notification        | action_performed                      | <code>action: string<br>currentPlan: string</code>
| learn               | step_clicked                          | <code>linkName: string</code>
| learn               | language_selected                     | <code>language: string (js, ruby...)</code>
| learn               | resource_selected                     | <code>language: string<br>resource: string (documentation, example....)</code>
| space_switcher      | opened                                | -
| space_switcher      | create_clicked                        | -
| space_switcher      | space_switched                        | <code>targetSpaceId: id-string<br>targetSpaceName: string</code>
| space               | template_selected                     | <code>templateName: string</code>
| space               | create                                | <code>templateName: string</code>
| search              | bulk_action_performed                 | <code>entityType: string (Entry, Asset)<br>method: string (publish, duplicate...)
| search              | search_performed                      | TODO: link Snowplow schema when merged
| search              | view_created                          | TODO: link Snowplow schema when merged
| search              | view_edited                           | TODO: link Snowplow schema when merged
| search              | view_deleted                          | TODO: link Snowplow schema when merged
| search              | view_loaded                           | TODO: link Snowplow schema when merged
| search              | ui_config_migrate                     | TODO: link Snowplow schema when merged
| modelling           | field_added                           | <code>contentTypeId: id-string<br>contentTypeName: string<br>fieldId: id-string<br>fieldName: string<br>fieldType: string<br>fieldItemType: string<br>fieldLocalized: bool<br>fieldRequired: bool</code>
| modelling           | custom_extension_selected             | <code>extensionId: id-string<br>extensionName: string<br>fieldType: string (Text, Symbol...)<br>contentTypeId: id-string</code>
| entry_editor        | state_changed                         | <code>entityType: string (Asset, Entry)<br>entityId: id-string<br>fromState: string (draft, published...)<br>toState: string</code>
| entry_editor        | disabled_fields_visibility_toggled    | <code>entryId: id-string<br>show: bool</code>
| entry_editor        | created_with_same_ct                  | <code>contentTypeId: id-string<br>entryId: id-string</code>
| entry_editor        | preview_opened                        | <code>envName: string<br>envId: id-string<br>previewUrl: string<br>entryId: id-string</code>
| entry_editor        | custom_extension_rendered             | <code>extensionId: id-string<br>extensionName: string<br>fieldType: string<br>contentTypeId: id-string<br>entryId: id-string</code>
| versioning          | no_snapshots                          | <code>entryId: id-string</code>
| versioning          | snapshot_opened                       | <code>entryId: id-string<br>snapshotId: id-string<br>snapshotType: string<br>authorIsUser: bool<br>source: string</code>
| versioning          | snapshot_closed                       | <code>entryId: id-string<br>snapshotId: id-string<br>snapshotType: string<br>authorIsUser: bool<br>changesDiscarded: bool</code>
| versioning          | snapshot_restored                     | <code>entryId: id-string<br>snapshotId: id-string<br>snapshotType: string<br>authorIsUser: bool<br>fullRestore: bool<br>restoredFieldsCount: number<br>showDiffsOnly: bool</code>
| versioning          | published_restored                    | <code>entryId: id-string<br>snapshotId: id-string<br>snapshotType: string<br>authorIsUser: bool</code>
| bulk_editor         | open                                  | <code>parentEntryId: string<br>refCount: number</code>
| bulk_editor         | close                                 | <code>parentEntryId: string<br>refCount: number<br>numEditedEntries: number<br>numPublishedEntries: number</code>
| bulk_editor         | action                                | <code>parentEntryId: string<br>refCount: number<br>entryId: string<br>action: enum</code>
| bulk_editor         | status                                | <code>parentEntryId: string<br>refCount: number<br>entryId: string<br>status: enum</code>
| bulk_editor         | add                                   | <code>parentEntryId: string<br>refCount: number<br>exiting: bool/code>
| content_preview     | created                               | <code>envName: string<br>envId: id-string<br>isDiscoveryApp: bool</code>
| content_preview     | updated                               | <code>envName: string<br>envId: id-string</code>
| content_preview     | deleted                               | <code>envName: string<br>envId: id-string</code>
| paywall             | viewed                                | <code>userCanUpgradePlan: bool</code>
| paywall             | closed                                | <code>userCanUpgradePlan: bool</code>
| paywall             | upgrade_clicked                       | <code>userCanUpgradePlan: bool</code>
| content_type        | create                                | <code>actionData: obj<br>response: obj</code>
| entry               | create                                | <code>actionData: obj<br>response: obj</code>
| asset               | create                                | <code>actionData: obj<br>response: obj</code>
| api_key             | create                                | <code>actionData: obj<br>response: obj</code>
| api                 | boilerplate                           | <code>platform: string<br>action: select|download|github</code>
| api                 | clipboard_copy                        | <code>source: space|cda|cpa</code>
| experiment          | start                                 | <code>id: string<br />variation: bool</code>
| experiment          | interaction                           | <code>id: string<br />variation: bool<br />interaction_context: string</code>
| element             | click                                 | <code>elementId: string<br />fromState: string<br />toState: string?</code>
| personal_access_token | action                              | <code>action: string<br>patId: string</code>
