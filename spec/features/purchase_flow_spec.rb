require 'spec_helper'

feature 'Purchase flow', js: true, sauce: true do
  include GatekeeperHelper

  describe "Resettable State", non_ci: true, order: :defined do
    before do
      ensure_login
      visit "#{app_host}/profile/subscription"
    end

    scenario 'Reset system' do
      reset_system
    end

    scenario 'Switch plan in step 2' do
      tab_iframe do
        choose_plan 'Pro'
        click_link 'Change'
      end
      expect(current_url).to eql("#{app_host}/profile/subscription")
    end

    scenario 'Change Subscription plan' do
      tab_iframe do
        choose_plan 'Pro'
        #first('.billing .table-edit-button').click
        fill_billing_information
        fill_credit_card_information
        click_button 'Continue'
        click_button 'Purchase'
        expect(page).to have_text('Your plan was successfully updated!')
      end
    end

    describe 'Billing information' do
      before do
        tab_iframe do
          click_link 'Billing Information'
        end
      end

      scenario 'Change Billing Address' do
        tab_iframe do
          first('.table-edit-button a').click
          fill_in 'billing_address_name', with: 'Foo McBar'
          click_button 'Update Billing Address'
          expect(page).to have_text('Foo McBar')
        end
      end

      scenario 'Set valid VAT number'

      scenario 'Set invalid VAT number'

      scenario 'Change Credit Card information' do
        tab_iframe do
          all('.table-edit-button a')[1].click
          fill_credit_card_information
          click_button 'Save Credit Card'
          expect(page).to have_text('Foo Bar')
        end
      end
    end

    def fill_billing_information
      find('#billing_address_name').set('Hans Wurst')
      find('#billing_address_address1').set('Dogestreet 123')
      #find('#billing_address_address2').set
      find('#billing_address_postal_code').set('90210')
      find('#billing_address_city').set('Duckburg')
      #find('#billing_address_state').set
      find('#billing_address_country').select('Germany')
      #find('#billing_address_vat_number').set
    end

    def fill_credit_card_information
      find('.cc-number input').set('4')
      all('.cc-number input')[0].set('4200')
      all('.cc-number input')[1].set('0000')
      all('.cc-number input')[2].set('0000')
      all('.cc-number input')[3].set('0000')
      find('.cc-exp-field-m').set('1')
      find('.cc-exp-field-y').set('16')
      find('.cc-name').set('Foo Bar')
      find('.flip-tab').click
      find('.cc-cvc').set('123')
    end

=begin
    scenario 'Toggle period' do # no yearly plans on staging
      tab_iframe do
        find('.toggle-button.annually').click
        expect(page).to have_text('/ year')
        expect(page).to_not have_text('/ month')
        find('.toggle-button.monthly').click
        expect(page).to_not have_text('/ year')
        expect(page).to have_text('/ month')
      end
    end

    scenario 'Switch period in step 2' do # no yearly plans on staging
      tab_iframe do
        first('a', text: 'Choose plan').click
        click_link 'Switch to annual'
        expect(page).to have_text('Annually')
        expect(page).to have_text('/ year')
      end
      expect_success 'The new plan has been switched to the annual plan'
    end

    scenario 'Use Coupon'
=end
  end

  describe "Stable state" do
    before do
      ensure_login
      visit "#{app_host}/profile/subscription"
    end

    scenario 'Toggle Plan details' do
      tab_iframe do
        first('.details-show').click
        expect(page).to have_text('Core platform')
        expect(page).to have_text('SSL')
        find('.details-hide').click
        expect(page).not_to have_text('Core platform')
        expect(page).not_to have_text('SSL')
      end
    end

    scenario 'Fill enterprise form' do
      tab_iframe do
        click_link 'Contact us'
        fill_in 'phone_number', with: '123456'
        fill_in 'description', with: "Hello Guys,\njust testing lol.\n\nTravis McTestbot"
        click_button 'Send message'
      end
      expect_success 'Thanks for getting in touch. We will get back to you shortly'
    end
  end
end
