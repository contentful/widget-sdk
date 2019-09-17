import { RequestOptions } from '@pact-foundation/pact-web';
import {
    defaultHeader,
    defaultUserProfileData
} from '../util/requests';

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
                body: defaultUserProfileData
            }
        }).as('getDefaultUserProfileData');

        return '@getDefaultUserProfileData';
    }
};