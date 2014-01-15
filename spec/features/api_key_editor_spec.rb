require 'spec_helper'

feature 'Api Key Editor', js: true do
  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Regenerating a Token' do
    add_button 'API Key'
    find('input[ng-model="apiKey.data.name"]').set 'Foobar'
    find('button.save').click
    expect_success 'saved successfully'
    token = find('input.access-token').value
    find('input[type=checkbox]').set(true)
    find('button.confirm').click
    find('button.save').click
    expect_success 'saved successfully'
    newtoken = find('input.access-token').value
    expect(newtoken).to_not eql(token)
  end

  scenario "Deleting an API Key" do
    add_button 'API Key'
    find('input[ng-model="apiKey.data.name"]').set 'Foobar'
    find('button.save').click
    expect_success 'saved successfully'

    click_button 'Delete'
    click_button 'Are you sure?'
    expect_success 'deleted successfully'
  end

end
