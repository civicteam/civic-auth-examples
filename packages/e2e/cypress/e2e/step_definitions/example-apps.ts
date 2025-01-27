/// <reference types="cypress" />
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { loginApp, sampleApp } from '../../support/pages/elements';

Given('I open the {string} app home page', (appType: string) => {
  cy.intercept('**/.well-known/openid-configuration', (req) => {
    req.reply((res) => {
      if (res.statusCode === 200) {
        console.log('Request successful');
      }
    });
  }).as('authRequest');

  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.visit(Cypress.env(`${appType}_BASE_URL`), {
    retryOnNetworkFailure: true,
    timeout: 10000
  })

  cy.wait('@authRequest').its('response.statusCode').should('eq', 200);
});

Given('I open the {string} server app home page', (appType: string) => {
  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.visit(Cypress.env(`${appType}_BASE_URL`))
});

Then('I click the sign in button', () => {
  cy.get(sampleApp.signInButton)
    .should('have.text', 'Sign in')
    .should('not.be.disabled');

  cy.get(sampleApp.signInButton)
    .should('be.visible')
    .click();
});

When('I click log in with dummy in the iframe', () => {

  cy.enter('#civic-auth-iframe').then(getBody => {
    cy.get('#civic-auth-iframe')
      .its('0.contentWindow')
      .then(iframeWin => {
        cy.stub(iframeWin, 'open').callsFake((url, target) => {
          expect(target).to.match(/civic-popup-/);
          // return null to simulate the popup being blocked
          // the civic-auth SDK should handle this and redirect
          return null;
        }).as('open');
      })

    getBody().find('button').contains('Log in with Dummy').click();

    // cy.get('@open').should('have.been.calledWithMatch', new RegExp(`${Cypress.env('DUMMY_APP_URL')}/auth\\?.*`));
  });
});

When('I click log in with dummy in the page', () => {
  cy.window().then(win => {
    cy.stub(win, 'open').callsFake((url, target) => {
      expect(target).to.match(/civic-popup-/);
      // return null to simulate the popup being blocked
      // the civic-auth SDK should handle this and redirect
      return null;
    }).as('open');
  })

  // Step 2: Trigger the action that opens the popup
  cy.contains('button', 'Log in with Dummy')
    .should('be.visible')
    .click();
});

Then('I fetch tokens from cookies', () => {
  const waitForCookie = (cookieName, retries = 20) => {
    cy.getCookie(cookieName).then((cookie) => {
      if (cookie && cookie.value) {
        expect(cookie.value).to.not.be.null;
      } else if (retries > 0) {
        cy.wait(1000); // Wait for 1 second before retrying
        waitForCookie(cookieName, retries - 1); // Retry
      } else {
        throw new Error(`${cookieName} cookie not found or is null after waiting`);
      }
    });
  };

  waitForCookie('access_token');
  waitForCookie('refresh_token');
  waitForCookie('timestamp');
});

Then('I fetch tokens from local storage', () => {
  const tokenKeys = ['access_token', 'refresh_token', 'timestamp'];

  // Function to wait for a local storage value to be set initially
  function waitForLocalStorageToBeSet(key: string) {
    return cy.waitUntil(() => {
      return cy.window().then((window) => {
        const currentValue = window.localStorage.getItem(key);
        const isSet = currentValue !== null;
        console.log(`Waiting for ${key} to be set: Current Value:`, currentValue, 'Set:', isSet);
        return isSet; // Return true when the value is set
      });
    }, {
      timeout: 60000, // 60 seconds
      interval: 1000   // Check every 1000ms
    });
  }

  // Wait for each token to be set and then fetch them
  cy.window().then(async (window) => {
    const tokens: Record<string, string | null> = {};

    for (const key of tokenKeys) {
      await waitForLocalStorageToBeSet(key); // Wait for the key to be set
      const value = window.localStorage.getItem(key);
      tokens[key] = value; // Capture the token value
      console.log(`Fetched ${key}:`, tokens[key]);
    }

    console.log('All tokens fetched:', tokens);
  });
});


let storedRefreshToken: string;

When('I store the refresh token', () => {
  cy.getCookie('refresh_token').then((cookie) => {
    storedRefreshToken = cookie ? cookie.value : '';
    expect(storedRefreshToken).to.not.be.empty;
  });
});

When('I store the refresh token from local storage', () => {
  cy.window().then((win) => {
    const refreshToken = win.localStorage.getItem('refresh_token');
    storedRefreshToken = refreshToken;
    expect(storedRefreshToken).to.not.be.empty;
  });
 });


Then('I confirm token refresh is successful', () => {
  cy.request({
    method: 'POST',
    url: 'https://auth.civic.com/oauth/token',
    form: true,
    body: {
      grant_type: 'refresh_token',
      refresh_token: storedRefreshToken,
      client_id: 'prod-demo-client-1'
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('access_token');
  });
});

When('I click the logout button', () => {
  // First click the dropdown container
  cy.get('#civic-dropdown-container').contains('Ghost').click();
  
  // Then find and click the Logout button within the dropdown
  cy.get('#civic-dropdown-container')
    .contains('button', 'Logout')
    .click();
});

When('I confirm successful logout', () => {
  cy.get(sampleApp.signInButton)
    .should('have.text', 'Sign in')
    .should('not.be.disabled');
});

Then('I confirm token refresh fails after logout', () => {
  const stage = Cypress.env('stage');
  const clientId = stage === 'prod' ? 'prod-demo-client-1' : 'example-repo-client-id';
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('OAUTH_SERVER_URL')[stage]}/token`,
    form: true,
    body: {
      grant_type: 'refresh_token',
      refresh_token: storedRefreshToken,
      client_id: clientId
    },
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(400);
  });
});


Then('I confirm that login-app user is on the correct url', () => {
  cy.url().should('match', new RegExp(`${Cypress.env('LOGIN_APP_URL')}/user`));
});

Then('I confirm that login-app user is redirected to the dashboard home', () => {
  cy.url().should('include', `${Cypress.env('LOGIN_APP_URL')}/dashboard/api/session?redirectTo=%2Fhome`);
  cy.url().should('include', `${Cypress.env('LOGIN_APP_URL')}/dashboard/home/new-account`);
});

