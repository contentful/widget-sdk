import { RequestOptions } from '@pact-foundation/pact-web';
import {
    defaultHeader
} from '../util/requests';

const defaultData = require('../fixtures/responses/user_account/default-data.json');
const identityLoginData = require('../fixtures/responses/user_account/identity-login-user-data.json');
const updateDefaultData = require('../fixtures/responses/user_account/udated-default-data.json');
const updatePasswordDefaultData = require('../fixtures/responses/user_account/updated-password-default-data.json');
const updateIdentityLoginData = require('../fixtures/responses/user_account/updated-password-identity-login.json');
const invalidCurrentPasswordData = require('../fixtures/responses/user_account/invalid-current-password.json');
const insecureNewPasswordData = require('../fixtures/responses/user_account/insecure-new-password.json');

const verify2FASuccess = require('../fixtures/responses/user_account/2fa-verify-success.json');
const verify2FAFail = require('../fixtures/responses/user_account/2fa-verify-fail.json');

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
        const interactionName = 'getDefaultUserProfileData';

        cy.addInteraction({
            provider: 'user_profile',
            state: 'user profile default login',
            uponReceiving: `a request to get the user profile data`,
            withRequest: queryUserProfileDataRequest(),
            willRespondWith: {
                status: 200,
                body: defaultData
            }
        }).as(interactionName);

        return `@${interactionName}`;
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
    return {
        method: 'PUT',
        path: `/users/me`,
        headers: { ...userProfileHeader, "X-Contentful-Version": "1" },
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
        headers: { ...userProfileHeader, "X-Contentful-Version": "1" },
        body
    };
}
export const addPassword = {
    willReturnSuccess() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user profile identity login',
            uponReceiving: `a request to add account password with valid password`,
            withRequest: queryChangePasswordRequest({
                password: "new-password"
            }),
            willRespondWith: {
                status: 200,
                body: updateIdentityLoginData
            }
        }).as('addPasswordSuccess');

        return '@addPasswordSuccess';
    },
    willReturnError() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user profile identity login',
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
                body: updatePasswordDefaultData
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

function queryPostTwoFA(): RequestOptions {
    return {
        method: 'POST',
        path: '/users/me/mfa/totp',
        headers: {
            ...defaultHeader,
            "CONTENT-TYPE": "application/vnd.contentful.management.v1+json",
            'X-Contentful-Enable-Alpha-Feature': 'mfa-api'
        },
        body: {}
    }
}

export const getTwoFAData = {
    willReturnIt() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user 2FA eligible',
            uponReceiving: `a request to get data for 2FA`,
            withRequest: queryPostTwoFA(),
            willRespondWith: {
                status: 201,
                body: {}
            }
        }).as('deleteUserAccount');

        return '@deleteUserAccount';
    }
};

function queryPutTwoFA(body): RequestOptions {
    return {
        method: 'PUT',
        path: '/users/me/mfa/totp/verify',
        headers: {
            ...defaultHeader,
            "CONTENT-TYPE": "application/vnd.contentful.management.v1+json",
            'X-Contentful-Enable-Alpha-Feature': 'mfa-api'
        },
        body
    }
}

export const verifyTwoFAData = {
    willReturnSuccess() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user with 2FA not yet enabled',
            uponReceiving: `a request to verify 2FA setup`,
            withRequest: queryPutTwoFA({ totpCode: "123456" }),
            willRespondWith: {
                status: 200,
                body: verify2FASuccess
            }
        }).as('verifyTwoFASuccess');

        return '@verifyTwoFASuccess';
    },
    willReturnFail() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user with 2FA not yet enabled',
            uponReceiving: `a request to verify 2FA setup with invalid code`,
            withRequest: queryPutTwoFA({ totpCode: "111111" }),
            willRespondWith: {
                status: 422,
                body: verify2FAFail
            }
        }).as('verifyTwoFAFail');

        return '@verifyTwoFAFail';
    }
};
