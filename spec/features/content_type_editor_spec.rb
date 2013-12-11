require 'spec_helper'

feature 'Content Type Editor', js: true, sauce: true do
  include ContentTypeHelper
  include EditorHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Creating a new Content Type with all possible field types' do
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Test Content Type'
    fill_in 'contentTypeDescription', with: 'Test description'
    ["Text", "Symbol", "Number", "Decimal Number", "Yes/No",
     "Date/Time", "Object", "Entry", "Asset", "Entries", "Assets",
     "Symbols", "Location"].each do |fieldType|
       add_field fieldType+' Field', fieldType
    end
    wait_for_sharejs
    click_button 'Activate'
    close_tab
    nav_bar 'entry-list' # this should not be necessary, but somehow the list isn't refreshed
    nav_bar 'content-type-list'
    table = find('.main-results tbody')
    expect(table).to have_text 'Test Content Type'
  end

  scenario 'Adding a field with different id' do
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Test Content Type'
    fill_in 'contentTypeDescription', with: 'Test description'
    add_field 'FooField', 'Object', id: 'fooId', required: true
    click_button 'Activate'
    expect_success('successfully')
  end

  scenario 'Adding validations to a field' do
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Test Content Type'
    fill_in 'contentTypeDescription', with: 'Test description'
    add_field 'Text', 'Text'
    for_field 'Text' do
      in_validations do
        add_validation 'Predefined Values' do
          find('.cf-validation-options input').set('apple, banana')
        end
      end
    end
    click_button 'Activate'
    expect_success('successfully')
  end

  scenario 'Adding blank validations to a field' do
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Test Content Type'

    validations = {
      'Text' => ['Predefined Values', 'Length', 'Regular Expression'],
      'Entry' => ['Content Type'],
      'Asset' => ['File Type'],
      'Number' => ['Numerical Range']
    }

    validations.each_pair do |type, validation_types|
      add_field(type, type)
      for_field type do
        in_validations do
          validation_types.each do |validation_type|
            add_validation(validation_type)
          end
        end
      end
    end

    click_button 'Activate'
    expect_warn 'Validation failed'
  end

  scenario 'Validation errors on a disabled field cause it to be shown' do
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Test Content Type'
    add_field 'Text', 'Text'
    click_button 'Activate'

    for_field 'Text' do
      fill_in 'fieldName', with: "\b"
      toggle_disable(true)
    end

    click_button 'Update'
    expect(page).to have_selector('.cf-field-settings')
  end

  scenario 'Toggling disabled fields' do
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Test Content Type'
    add_field 'Text', 'Text'
    click_button 'Activate'

    for_field 'Text' do
      toggle_disable(true)
    end

    click_button 'Update'
    page.should_not have_selector('.cf-field-settings')
    find('.editor-top-right .dropdown-toggle').click
    find('label', text: 'Show disabled fields').click
    page.should have_selector('.cf-field-settings')
  end

  scenario 'Deactivating a content type' do
    # Create content type
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Test Content Type'
    add_field 'Text', 'Text'
    wait_for_sharejs
    click_button 'Activate'
    expect_success 'activated successfully'

    # Create entry for content type
    add_button 'Test Content Type'
    edit_field('text', 'en-US', 'textarea').set('bla')
    wait_for_sharejs
    sleep 2 # Wait for Elasticsearch to catch up

    # Switch back to content type editor and try to deactivate
    select_tab 'Test Content Type'
    click_button 'Deactivate'
    expect_error 'has entries'

    # Switch back to entry editor and delete entry
    select_tab 'bla'
    find('a', text: 'More').click
    find('li.delete').click
    find('li.delete-confirm').click
    expect_success 'deleted successfully'
    sleep 2 # Wait for Elasticsearch to catch up

    # Switch back to content type editor and deactivate
    select_tab 'Test Content Type'
    click_button 'Deactivate'
    expect_success 'deactivated successfully'
  end
end
