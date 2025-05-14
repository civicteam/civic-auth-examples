/// <reference types="cypress" />
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { exampleAppHome } from '../../support/pages/elements';
import 'cypress-iframe';

Given('I open the app home page', (appType: string) => {
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
  cy.visit('http://localhost:3000', {
    retryOnNetworkFailure: true,
    timeout: 10000,
  })
  
  cy.wait('@authRequest').its('response.statusCode').should('eq', 200);
});

Given('I open the server app home page', (appType: string) => {
  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.visit('http://localhost:3000', {
    retryOnNetworkFailure: true,
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Origin': 'http://localhost:3000'
    }
  })
});

Then('I click the sign in button', () => {
  cy.get(exampleAppHome.signInButton)
    .should('have.text', 'Sign in')
    .should('not.be.disabled');

  cy.get(exampleAppHome.signInButton)
    .should('be.visible')
    .click();
});

Then('I click the custom sign in button', () => {
  cy.get(exampleAppHome.customSignInButton)
    .should('have.text', 'Sign in (Custom)')
    .should('not.be.disabled');

  cy.get(exampleAppHome.customSignInButton)
    .should('be.visible')
    .click();
});

Then('I click the select wallet button', () => {
  cy.get(exampleAppHome.selectWalletButton)
    .should('have.text', 'Select Wallet')
    .should('not.be.disabled');

  cy.get(exampleAppHome.selectWalletButton)
    .should('be.visible')
    .click();
});

Then('I click the civic wallet button', () => {
  cy.get(exampleAppHome.civicWalletButton).contains('Civic WalletDetected')
    .should('not.be.disabled');

  cy.get(exampleAppHome.civicWalletButton).contains('Civic WalletDetected')
    .should('be.visible')
    .click();
});

Then('I confirm I am logged in', () => {
  cy.get('#civic-dropdown-container').contains('button', 'Ghost').should('be.visible');
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

      getBody().find('[data-testid="civic-login-oidc-button-dummy"]').click();

    // getBody().find('button').contains('Log in with Dummy').click();
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
  cy.get('[data-testid="civic-login-oidc-button-dummy"]').should('be.visible').click();

  // // Step 2: Trigger the action that opens the popup
  // cy.contains('button', 'Log in with Dummy')
  //   .should('be.visible')
  //   .click();
});

When('I confirm provider is visible on the page', () => {
  cy.window().then(win => {
    cy.stub(win, 'open').callsFake((url, target) => {
      expect(target).to.match(/civic-popup-/);
      // return null to simulate the popup being blocked
      // the civic-auth SDK should handle this and redirect
      return null;
    }).as('open');
  })

  // Step 2: Trigger the action that opens the popup
  cy.contains('button', 'Google')
    .should('be.visible')
});

When('I confirm provider is visible in iframe', () => {
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

    getBody().find('button').contains('Google').should('be.visible');
  });
});

When('I click log in with dummy in the server app page', () => {
  cy.intercept('GET', '/auth/callback*', (req) => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expiresInSeconds = nowInSeconds + 60; // 1 minute from now
    const expires = new Date(expiresInSeconds * 1000).toUTCString();

    const mockJwt = {
      alg: 'RS256',
      typ: 'JWT',
      kid: 'civic-auth-token-signer-key'
    };

    const mockPayload = {
      sub: 'test-user',
      exp: expiresInSeconds,
      iat: nowInSeconds
    };

    const mockToken = `${btoa(JSON.stringify(mockJwt))}.${btoa(JSON.stringify(mockPayload))}.mocksignature`;
    
    req.reply({
      statusCode: 302,
      headers: {
        'location': '/admin/hello',
        'content-length': '0',
        'set-cookie': `id_token=${mockToken}; Path=/; Expires=${expires}; HttpOnly; SameSite=Lax`,
        'date': new Date().toUTCString()
      },
      body: ''
    });
  }).as('authCallback');

  cy.get('[data-testid="civic-login-oidc-button-dummy"]').should('be.visible').click();

  // cy.contains('button', 'Log in with Dummy')
  //   .should('be.visible')
  //   .click();

  cy.wait('@authCallback', { timeout: 30000 });
});

Then('I am logged in and redirected to the hello page', (appType: string) => {
  cy.url().should('include', '/admin/hello');
  cy.contains('Hello').should('be.visible');
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
      client_id: Cypress.env('clientId')
    },
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
  cy.get(exampleAppHome.signInButton)
    .should('have.text', 'Sign in')
    .should('not.be.disabled');
});

Then('I confirm token refresh fails after logout', () => {
  cy.request({
    method: 'POST',
    url: 'https://auth.civic.com/oauth/token',
    form: true,
    body: {
      grant_type: 'refresh_token',
      refresh_token: storedRefreshToken,
      client_id: Cypress.env('clientId')
    },
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(400);
  });
});

When('I create the embedded wallet', () => {
  cy.contains('button', 'Create Wallet', { timeout: 20000 }).should('be.visible').click()
});

When('I connect the embedded wallet', () => {
  cy.contains('button', 'Connect Wallet', { timeout: 20000 }).should('be.visible').click()
});

When('The embedded wallet is connected', () => {
  cy.contains('Wallet is connected', { timeout: 20000 }).should('be.visible')
});

Then('I confirm that login-app user is on the correct url', () => {
  cy.url().should('match', new RegExp(`${Cypress.env('LOGIN_APP_URL')}/user`));
});

Then('I confirm that login-app user is redirected to the dashboard home', () => {
  cy.url().should('include', `${Cypress.env('LOGIN_APP_URL')}/dashboard/api/session?redirectTo=%2Fhome`);
  cy.url().should('include', `${Cypress.env('LOGIN_APP_URL')}/dashboard/home/new-account`);
});

