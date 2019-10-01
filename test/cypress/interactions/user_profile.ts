import { RequestOptions } from '@pact-foundation/pact-web';
import {
    defaultHeader
} from '../util/requests';

const defaultData = require('../fixtures/responses/user_account/default-data.json');
const identityLoginData = require('../fixtures/responses/user_account/identity-login-user-data.json');
const updateDefaultData = require('../fixtures/responses/user_account/udated-default-data.json');
const invalidCurrentPasswordData = require('../fixtures/responses/user_account/invalid-current-password.json');
const insecureNewPasswordData = require('../fixtures/responses/user_account/insecure-new-password.json');

function queryUserProfileDataRequest(): RequestOptions {
    return {
        method: 'GET',
        path: `/users/me`,
        headers: defaultHeader,
        query: { profile: '' }
    };
}

export const getUserProfileData = {
    willReturnDefault() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/default',
            uponReceiving: `a request to get the user profile data`,
            withRequest: queryUserProfileDataRequest(),
            willRespondWith: {
                status: 200,
                body: defaultData
            }
        }).as('getDefaultUserProfileData');

        return '@getDefaultUserProfileData';
    },
    willReturnIdentityLoginUser() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/identity_login',
            uponReceiving: `a request to get the user profile data for user with identity login only`,
            withRequest: queryUserProfileDataRequest(),
            willRespondWith: {
                status: 200,
                body: identityLoginData
            }
        }).as('getIdentityLoginUserProfileData');

        return '@getIdentityLoginUserProfileData';
    }
};

function queryUserProfileUpdateRequest(): RequestOptions {
    return {
        method: 'PUT',
        path: `/users/me`,
        headers: defaultHeader
    };
}

export const updateDefaultUserProfileData = {
    willReturnSuccess() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/default',
            uponReceiving: `a request to update the user profile data`,
            withRequest: queryUserProfileUpdateRequest(),
            willRespondWith: {
                status: 200,
                body: updateDefaultData
            }
        }).as('updateSuccessDefaultUserProfileData');

        return '@updateSuccessDefaultUserProfileData';
    },
    willReturnError() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/default',
            uponReceiving: `a request to update the user profile data with wrong password`,
            withRequest: queryUserProfileUpdateRequest(),
            willRespondWith: {
                status: 422,
                body: invalidCurrentPasswordData
            }
        }).as('updateWithErrorDefaultUserProfileData');

        return '@updateWithErrorDefaultUserProfileData';
    }
};

function queryChangePasswordRequest(): RequestOptions {
    return {
        method: 'PUT',
        path: `/users/me`,
        headers: defaultHeader
    };
}

export const changePassword = {
    willReturnSuccess() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/default',
            uponReceiving: `a request to change account password with valid password`,
            withRequest: queryChangePasswordRequest(),
            willRespondWith: {
                status: 200,
                body: defaultData
            }
        }).as('changePasswordSuccess');

        return '@changePasswordSuccess';
    },
    willReturnError() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/default',
            uponReceiving: `a request to change account password with insecure password`,
            withRequest: queryChangePasswordRequest(),
            willRespondWith: {
                status: 422,
                body: insecureNewPasswordData
            }
        }).as('changePasswordError');

        return '@changePasswordError';
    }
};

function queryIdentityDeleteRequest(): RequestOptions {
    return {
        method: 'DELETE',
        path: `/users/me/identities/3035`,
        headers: defaultHeader
    };
}

export const deleteIdentity = {
    willReturnIt() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/default',
            uponReceiving: `a request to delete a user identity`,
            withRequest: queryIdentityDeleteRequest(),
            willRespondWith: {
                status: 200
            }
        }).as('deleteIdentity');

        return '@deleteIdentity';
    }
};