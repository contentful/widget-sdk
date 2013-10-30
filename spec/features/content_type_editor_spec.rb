require 'spec_helper'

feature 'Content Type Editor', js: true, non_ci: true do
  include ContentTypeHelper

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
     "Date/Time", "Object", "Link to Entry", "List of Entries",
     "List of Symbols", "Location"].each do |fieldType|
       add_field fieldType+' Field', fieldType
    end
    sleep 2
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
    expect(page).to have_selector('.notification.info')
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
    expect(page).to have_selector('.notification.info')
  end
end
