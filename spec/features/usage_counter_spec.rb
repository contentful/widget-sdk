require 'spec_helper'

feature 'Usage Tracking', js: true do
  include ContentTypeHelper
  include GatekeeperHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Track resources' do
    expect_usage(
      'Spaces' => 1,
      'Content Types' => 0,
      'Entries' => 0,
      'API Keys' => 0
    )
    create_content_type 'Text'
    add_button 'Entry with Text'
    find('button.publish').click

    add_button 'API Key'
    find('input[ng-model="apiKey.data.name"]').set 'Foobar'
    find('button.save').click
    expect_success 'saved successfully'

    expect_usage(
      'Spaces' => 1,
      'Content Types' => 1,
      'Entries' => 1,
      'API Keys' => 1
    )

    open_tab 'Foobar'
    click_button 'Delete'
    click_button 'Are you sure?'
    expect_success 'deleted successfully'

    # Automatic switch to entry
    click_button 'Unpublish'
    expect_success 'unpublished successfully'
    find('.tab-actions .dropdown-toggle').click
    find('li.delete').click
    find('li.delete-confirm').click
    expect_success 'deleted successfully'

    nav_bar 'content-type-list'
    find('td', text: 'Entry with Text').click
    click_button 'Deactivate'
    expect_success 'deactivated successfully'
    click_button 'Delete'
    click_button 'Are you sure?'
    expect_success 'deleted successfully'

    expect_usage(
      'Spaces' => 1,
      'Content Types' => 0,
      'Entries' => 0,
      'API Keys' => 0 
    )
  end

  scenario 'Track Users' do
    expect_usage('Users' => 1)
    nav_bar 'space-settings'

    tab_iframe do
      click_link 'Users'
      click_link 'Invite New User'
      find('#space_membership_email').set('testuser1@contentful.com')
      check 'Developer'
      click_button 'Invite New User'
    end
    expect_success 'invited successfully'

    expect_usage('Users' => 2)
  end

  def expect_usage(usages)
    sleep 0.5
    find('.user .dropdown-toggle').click
    find('.user li', text: 'Account Settings').click
    tab_iframe do
      choose_organization('Test Organization')
      click_link 'Usage'
      usages.each_pair do |key, amount|
        value = find(:xpath, "//td[text() = '#{key}']/../td[2]").text.to_i
        expect(value).to eql(amount), "Expected #{amount} counted #{key} but found #{value}"
      end
    end
  end

end
