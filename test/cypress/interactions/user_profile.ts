import { RequestOptions } from '@pact-foundation/pact-web';
import {
    defaultHeader
} from '../util/requests';

const userProfileData = require('../fixtures/responses/user-profile-data.json');
const updatedUserProfileData = require('../fixtures/responses/updated-user-profile-data.json');

function queryUserProfileDataRequest(): RequestOptions {
    return {
        method: 'GET',
        path: `/users/me`,
        headers: defaultHeader,
        query: { profile: '' }
    };
}

export const getDefaultUserProfileData = {
    willReturnIt() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/default',
            uponReceiving: `a request to get the user profile data`,
            withRequest: queryUserProfileDataRequest(),
            willRespondWith: {
                status: 200,
                body: userProfileData
            }
        }).as('getDefaultUserProfileData');

        return '@getDefaultUserProfileData';
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
    willReturnIt() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/default',
            uponReceiving: `a request to update the user profile data`,
            withRequest: queryUserProfileUpdateRequest(),
            willRespondWith: {
                status: 200,
                body: updatedUserProfileData
            }
        }).as('updateDefaultUserProfileData');

        return '@updateDefaultUserProfileData';
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
    willReturnIt() {
        cy.addInteraction({
            provider: 'user_profile',
            state: 'user/default',
            uponReceiving: `a request to change account password`,
            withRequest: queryChangePasswordRequest(),
            willRespondWith: {
                status: 200,
                body: userProfileData
            }
        }).as('changePassword');

        return '@changePassword';
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