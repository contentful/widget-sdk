require 'spec_helper'

feature 'Content Type Editor', js: true do
  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  def add_field(name, type, options={})
    fill_in 'newName', with: name
    fill_in 'newId'  , with: options[:id] if options[:id]
    find('.type .dropdown-toggle').click
    find(:xpath, ".//span[text()='#{type}']/..").click
    find('input[ng-model="newField.localized"]').check if options[:localized]
    find('input[ng-model="newField.required"]').check if options[:required]
    find('.button.new').click
  end

  scenario 'Creating a new Content Type' do
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Test Content Type'
    fill_in 'contentTypeDescription', with: 'Test description'
    ["Text", "Symbol", "Integer", "Floating-point", "Yes/No",
     "Date/Time", "Object", "Link to Entry", "List of Entries",
     "List of Symbols", "Location"].each do |fieldType|
       add_field fieldType+' Field', fieldType
    end
    click_button 'Activate'
    close_tab
    nav_bar 'content-type-list'
    table = find('.main-results tbody')
    expect(table).to have_text 'Test Content Type'
    sleep 5
  end

  scenario 'Adding a field with different id'

  scenario 'Adding validations to a field'
end
