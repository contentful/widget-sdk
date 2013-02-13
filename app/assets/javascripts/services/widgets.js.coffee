# Sorry for coffee, but I need multiline strings :(

'use strict'

editWidgets =
  string:
    textField:
      name: "Single line text field"
      template: """<input type="text" ng-model="value" ot-bind="text"/>"""
  text:
    textArea:
      name: "Multiline text field"
      template: """<textarea class="input-xxlarge" ng-model="value" ot-bind="text"></textarea>"""
  boolean:
    checkBox:
      name: "Boolean Checkbox"
      template: """<label class="checkbox"><input type="checkbox" ng-model="value" ot-bind="replace"/> <span ng-show="value">Yes</span><span ng-show="!value">No</span></label>"""
  date:
    textField:
      name: "Date Field"
      template: """<div class="cf-datetime-editor"/>"""
  array:
    textField:
      name: "Array field"
      template: """<input type="text" ng-list="" ng-model="value" ot-bind="model"/>"""
  object:
    jsonArea:
      name: "JSON Field"
      template: """<textarea class="input-xxlarge" ng-model="value" ot-bind="model"></textarea>"""
      link: (scope, elm, attr) ->
        controller = elm.find('textarea').inheritedData('$ngModelController')
        controller.$formatters.push (obj) -> JSON.stringify(obj)
        controller.$parsers.push (string) ->
          try
            json = JSON.parse(string)
            controller.$setValidity('json', true)
            return json
          catch e
            controller.$setValidity('json', false)
            return undefined
  location:
    googlemap:
      name: "Location Picker"
      template: """<div class="cf-location-editor"></div>"""

  number:
    textField:
      name: "Textfield for floats"
      template: """<input type="number" ng-model="value" ot-bind="replace"/>"""
      link: (scope, elm, attr) ->
        controller = elm.find('input').inheritedData('$ngModelController')
        controller.$parsers.unshift (viewValue) ->
          FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/
          if FLOAT_REGEXP.test(viewValue)
            controller.$setValidity('float', true)
            return parseFloat(viewValue.replace(',', '.'))
          else
            controller.$setValidity('float', false)
            return undefined
  integer:
    textField:
      name: "Textfield for integers"
      template: """<input type="number" ng-pattern="/^\\-?\\d*$/" ng-model="value" ot-bind="replace"/>"""
  link:
    selector:
      name: "Link selector"
      template: """<div cf-autocomplete="entry"/>"""
  
displayWidgets =
  string:
    textField:
      template: "{{entry[fieldName]}}"

class WidgetBuilder
  editor:  (fieldType, widgetType) ->
    type = editWidgets[fieldType] ? editWidgets.string
    type[widgetType] ? _.values(type)[0]
  display: (fieldType, widgetType) ->
    type = editWidgets[fieldType] ? editWidgets.string
    type[widgetType] ? _.values(type)[0]
  availableEditWidgets: (fieldType) ->
    _.keys(editWidgets[fieldType])
  availableDisplayWidgets: (fieldType) ->
    _.keys(displayWidgets[fieldType])
        
angular.module('contentful/services').service('widgets', WidgetBuilder);
