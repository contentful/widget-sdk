# Sorry for coffee, but I need multiline strings :(

define [
  'services'
  'lodash'
], (services, _) ->
  'use strict'

  editWidgets =
    string:
      textField: """
        <label for="{{fieldName}}">
        <input type="text" name="{{fieldName}}" ng-model="entry[fieldName]"/>
        """
      textArea: """
        <label for="{{fieldName}}">
        <textarea name="{{fieldName}}" ng-model="entry[fieldName]"></textarea>
        """
  displayWidgets =
    string:
      textField: "{{entry[fieldName]}}"

  WidgetBuilder = ->

  WidgetBuilder.prototype = 
    editor:  (fieldType, widgetType) ->
    display: (fieldType, widgetType) ->
    availableEditWidgets: (fieldType) ->
    availableDisplayWidgets: (fieldType) ->
      
  services.service('widgets', WidgetBuilder);
