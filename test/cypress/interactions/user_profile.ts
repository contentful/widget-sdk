import { RequestOptions } from '@pact-foundation/pact-web';
import {
    defaultHeader
} from '../util/requests';

const defaultData = require('../fixtures/responses/user_account/default-data.json');
const identityLoginData = require('../fixtures/responses/user_account/identity-login-user-data.json');
const updateDefaultData = require('../fixtures/responses/user_account/udated-default-data.json');
const invalidCurrentPasswordData = require('../fixtures/responses/user_account/invalid-current-password.json');
const insecureNewPasswordData = require('../fixtures/responses/user_account/insecure-new-password.json');

const userProfileHeader = {
    ...defaultHeader,
    "CONTENT-TYPE": "application/vnd.contentful.management.v1+json"
}

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
            state: 'user profile default login',
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
            state: 'user profile identity login',
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

function queryUserProfileUpdateRequest(body): RequestOptions {
    console.log('body')
    return {
        method: 'PUT',
        path: `/users/me`,
        headers: { ...userProfileHeader, "X-Contentful-Version": "2" },
        body
    };
}

export const updateDefaultUserProfileData = {
    willReturnSuccess() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user profile default login',
            uponReceiving: `a request to update the user profile data`,
            withRequest: queryUserProfileUpdateRequest({
                firstName: "NewFirstName",
                lastName: "NewLastName",
                email: "new-email@example.com",
                currentPassword: "test12345",
                logAnalyticsFeature: ""
            }),
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
            state: 'user profile default login',
            uponReceiving: `a request to update the user profile data with wrong password`,
            withRequest: queryUserProfileUpdateRequest({
                email: "new-email@example.com",
                firstName: "NewFirstName",
                lastName: "NewLastName",
                logAnalyticsFeature: "",
                currentPassword: "invalid-current-password"
            }),
            willRespondWith: {
                status: 422,
                body: invalidCurrentPasswordData
            }
        }).as('updateWithErrorDefaultUserProfileData');

        return '@updateWithErrorDefaultUserProfileData';
    }
};

function queryChangePasswordRequest(body): RequestOptions {
    return {
        method: 'PUT',
        path: `/users/me`,
        headers: userProfileHeader,
        body
    };
}
export const addPassword = {
    willReturnSuccess() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user profile default login',
            uponReceiving: `a request to add account password with valid password`,
            withRequest: queryChangePasswordRequest({
                password: "new-password"
            }),
            willRespondWith: {
                status: 200,
                body: defaultData
            }
        }).as('addPasswordSuccess');

        return '@addPasswordSuccess';
    },
    willReturnError() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user profile default login',
            uponReceiving: `a request to add account password with insecure password`,
            withRequest: queryChangePasswordRequest({
                password: "password"
            }),
            willRespondWith: {
                status: 422,
                body: insecureNewPasswordData
            }
        }).as('addPasswordError');

        return '@addPasswordError';
    }
};

export const changePassword = {
    willReturnSuccess() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user profile default login',
            uponReceiving: `a request to change account password with valid password`,
            withRequest: queryChangePasswordRequest({
                currentPassword: "test12345",
                password: "new-password"
            }),
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
            state: 'user profile default login',
            uponReceiving: `a request to change account password with insecure password`,
            withRequest: queryChangePasswordRequest({
                currentPassword: "test12345",
                password: "password"
            }),
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
            state: 'user profile default login',
            uponReceiving: `a request to delete a user identity`,
            withRequest: queryIdentityDeleteRequest(),
            willRespondWith: {
                status: 204
            }
        }).as('deleteIdentity');

        return '@deleteIdentity';
    }
};

function queryDeleteUserAccount(): RequestOptions {
    return {
        method: 'POST',
        path: '/users/me/user_cancellations',
        headers: { ...defaultHeader, "CONTENT-TYPE": "application/vnd.contentful.management.v1+json" },
        body: {
            "reason": "other",
            "description": ""
        }
    };
}

export const deleteUserAccount = {
    willReturnIt() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user profile default login',
            uponReceiving: `a request to delete the user account`,
            withRequest: queryDeleteUserAccount(),
            willRespondWith: {
                status: 201
            }
        }).as('deleteUserAccount');

        return '@deleteUserAccount';
    }
};
