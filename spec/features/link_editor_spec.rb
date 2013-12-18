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

  scenario 'Working with links' do
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

    add_button 'Entry with Links'
    wait_for_sharejs
    edit_field 'textField' do
      find('textarea').set 'Root'
    end
    wait_for_elasticsearch
    edit_field 'entryField' do
      find('input').set('AAAA')
      find('.result-list span', text: 'AAAA').click
      expect(page).to     have_selector('li')
      expect(page).to_not have_selector('input')
      find('.ss-delete').click
      expect(page).to_not have_selector('li')
      expect(page).to     have_selector('input')
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
      expect(page).to have_selector('li', text: 'AAAA', count: 2)
      expect(page).to have_selector('li', text: 'BBBB', count: 1)
      expect(page).to have_selector('input')
      first('.ss-delete').click
      unscope{ wait_for_sharejs }
      expect(page).to have_selector('li', text: 'AAAA', count: 1)
      expect(page).to have_selector('li', text: 'BBBB', count: 1)
    end

    edit_field 'entryField' do
      click_button 'New'
      find('.dropdown-menu li', text: 'Entry with Links').click
    end
    find('.tab-title', text: 'Untitled')
    wait_for_sharejs
    # Flip to new editor
    edit_field 'textField' do
      find('textarea').set('Foobar')
    end
    wait_for_sharejs
    click_button 'Publish'
    expect_success
    close_tab
    # Back to root editor
    expect(page).to have_selector('li', text: 'Foobar', count: 1)
    
    # Links work
    click_link 'BBBB'
    click_button 'Unpublish'
    expect_success 'unpublished successfully'
    find('.dropdown-toggle', text: 'More').click
    find('li.delete').click
    find('li.delete-confirm').click
    expect_success 'deleted successfully'
    # Back to root
    open_tab('Root')
    # Dead links
    expect(page).to have_text('Missing entity')

    wait_for_sharejs
    click_button 'Publish'
    expect_error 'Validation failed'
  end

end
