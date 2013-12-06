require 'spec_helper'

feature 'Link Editor', js: true, sauce: true do
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

  scenario 'Working with a single link' do
    create_content_type 'Entry with Links', 'Text', 'Entry', 'Entries'
    add_button 'Entry with Links'
    wait_for_sharejs
    edit_field 'textField' do
      find('textarea').set 'AAAA'
    end
    wait_for_sharejs
    click_button 'Publish'
    expect_success
    add_button 'Entry with Links'
    wait_for_sharejs
    edit_field 'textField' do
      find('textarea').set 'BBBB'
    end
    wait_for_sharejs
    click_button 'Publish'
    expect_success
    sleep 2 # Wait for elasticsearch

    add_button 'Entry with Links'
    wait_for_sharejs
    edit_field 'textField' do
      find('textarea').set 'Root'
    end
    edit_field 'entryField' do
      find('input').set('AAAA')
      find('.result-list span', text: 'AAAA').click
      page.should     have_selector('li')
      page.should_not have_selector('input')
      find('.ss-delete').click
      page.should_not have_selector('li')
      page.should     have_selector('input')
    end
    edit_field 'entriesField' do
      find('input').set('AAAA')
      find('.result-list span', text: 'AAAA').click
      unscope{ wait_for_sharejs }
      find('input').set('AAAA')
      find('.result-list span', text: 'AAAA').click
      unscope{ wait_for_sharejs }
      find('input').set('BBBB')
      find('.result-list span', text: 'BBBB').click
      unscope{ wait_for_sharejs }
      page.should have_selector('li', text: 'AAAA', count: 2)
      page.should have_selector('li', text: 'BBBB', count: 1)
      page.should have_selector('input')
      first('.ss-delete').click
      unscope{ wait_for_sharejs }
      page.should have_selector('li', text: 'AAAA', count: 1)
      page.should have_selector('li', text: 'BBBB', count: 1)
    end

    edit_field 'entryField' do
      click_button 'New'
      find('.dropdown-menu li', text: 'Entry with Links').click
    end
    # Flip to new editor
    edit_field 'textField' do
      find('textarea').set('Foobar')
    end
    wait_for_sharejs
    click_button 'Publish'
    expect_success
    close_tab
    # Back to root editor
    page.should have_selector('li', text: 'Foobar', count: 1)
    
    # Links work
    click_link 'BBBB'
    click_button 'Unpublish'
    find('.dropdown-toggle', text: 'More').click
    find('li.delete').click
    find('li.delete-confirm').click
    # Back to root
    open_tab('Root')
    # Dead links
    page.should have_text('Missing entity')

    wait_for_sharejs
    click_button 'Publish'
    expect_success
  end

  scenario 'Adding link, restricted by type'
end

