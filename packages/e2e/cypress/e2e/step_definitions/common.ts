/// <reference types="cypress" />
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import {dummyApp, exampleAppHome} from "../../support/pages/elements";
import { ForwardedTokens } from '@civic/auth/src';
import { assertDataFromSDKMatchesTokenContents } from '../../support/pages/client-app-using-sdk';
import { checkAccessTokenFields } from '../../support/pages/util';


When('I select redirect', () => {
  cy.get(exampleAppHome.selectRedirect).click();
});

When('I select iframe', () => {
  cy.get(exampleAppHome.selectIframe).click();
});

When('I click sign in button and confirm oauth request', () => {
  cy.intercept('GET', `${Cypress.env('SERVER_URL')}/auth?**`).as('authRequest');

  cy.get(exampleAppHome.signInButton).should('have.text', 'Sign in').click();

  // TODO: Make unit test for this and delete everything here except the click
  cy.wait('@authRequest', { timeout:20000 }).then((interception) => {
    expect(interception.response?.statusCode).to.eq(303);

    // Step 2: Parse the request URL
    const requestUrl = new URL(interception.request.url);
    const params = requestUrl.searchParams;

    // List of required parameters
    const requiredParams = [
      'response_type',
      'client_id',
      'state',
      'scope',
      'redirect_uri',
      'code_challenge',
      'code_challenge_method',
      'nonce'
    ];

    // Step 3: Assert that each required parameter is present and has a non-empty value
    requiredParams.forEach(param => {
      const value = params.get(param);
      expect(value, `${param} should have a value`).to.not.be.empty;
    });
  });
});

Then('I confirm the url after redirect', () => {
  cy.url().should('include', Cypress.env('LOGIN_APP_URL')) // Confirm the base URL
    .then((url) => {
      const urlParams = new URLSearchParams(url.split('?')[1]);

      const requiredParams = [
        'client_id',
        'source_system_id',
        'scope',
      ];

      requiredParams.forEach(param => {
        const value = urlParams.get(param);
        expect(value, `${param} should not be empty`).to.not.be.empty;
      });
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

When('I confirm svgs are visible', () => {
  let allRequestsReturn304 = true;
  
  cy.intercept('GET', '**/*.svg', (req) => {
    if (req.response?.statusCode !== 304) {
      allRequestsReturn304 = false;
    }
  }).as('svgRequests')

  
  // Wait for SVG requests to complete and verify they were all 304
  cy.get('@svgRequests.all').then(() => {
    expect(allRequestsReturn304).to.be.true;
  })
})

When('I confirm buttons are visible', () => {
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
});

When('I confirm assets have been loaded', () => {
  cy.window().then((win) => {
    const resources = win.performance.getEntriesByType('resource');

    // Optionally, log all resources
    cy.log('Loaded Resources:', resources);

    // Check for failed or missing resources
    const failedResources = resources.filter((resource) => {
      const status = resource.responseStatus || 200;
      return status >= 400 || !resource.name;
    });

    // Assert that no resources failed
    expect(failedResources.length).to.equal(0);
  });
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

    cy.get('@open').should('have.been.calledWithMatch', new RegExp(`${Cypress.env('DUMMY_APP_URL')}/auth\\?.*`));
  });
});

const pageOrIframeSelector = (iframeOrRedirect, selector, callback) => {
  if (iframeOrRedirect === 'iframe') {
    cy.frameLoaded({ url: Cypress.env('DUMMY_APP_URL')});
    cy.enter({ url: Cypress.env('DUMMY_APP_URL')}).then(getBody => {
      getBody().find(selector).then((el) => callback(cy.wrap(el)));
    });
  } else {
    cy.get(selector).then((el) => callback(cy.wrap(el)));
  }
};

When('I enter email in the {string}', (iframeOrRedirect) => {
  pageOrIframeSelector(iframeOrRedirect, dummyApp.emailField, (emailElement) => {
    emailElement.type('test');
  });
});

When('I enter password in the {string}', (iframeOrRedirect) => {
  pageOrIframeSelector(iframeOrRedirect, dummyApp.passwordField, (passwordElement) => {
    passwordElement.type('test');
  });
});

When('I click sign in button in the {string}', (iframeOrRedirect) => {
  pageOrIframeSelector(iframeOrRedirect, dummyApp.button, (buttonElement) => {
    buttonElement.should('have.text', 'Sign-in').click();
  });
});

When('I click continue button in the {string}', (iframeOrRedirect) => {
  pageOrIframeSelector(iframeOrRedirect, dummyApp.button, (buttonElement) => {
    buttonElement.should('have.text', 'Continue').click();
  });
});

Then('I confirm that the correct calls are made to the token endpoint', () => {
  cy.intercept('POST', `${Cypress.env('SERVER_URL')}/token`).as('tokenRequest');

  // Wait for the POST request and confirm it returns a 200 status
  cy.wait('@tokenRequest', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
});

Then('I confirm that user is redirected to correct url', () => {
  cy.location('search').should('include', 'code=');
});

When('I confirm id and access tokens are returned', () => {
  // Assert the response body matches the expected structure
  cy.get('@tokenRequest').its('response.body').should((responseBody) => {
    // Check that the access_token exists
    expect(responseBody).to.have.property('access_token');

    // Check that the access_token is a valid JWT format
    const tokenParts = responseBody.access_token.split('.');
    expect(tokenParts).to.have.length(3); // A JWT consists of 3 parts separated by periods

    // Check the rest of the response properties
    expect(responseBody).to.have.property('expires_in', 40);
    expect(responseBody).to.have.property('id_token');
    expect(responseBody).to.have.property('token_type', 'Bearer');
    expect(responseBody).to.have.property('scope', '');
  });
});

// TODO should probably be a unit test
Then('I confirm the tokens returned match what is displayed on the page', () => {
  cy.get('@tokenRequest').its('response.body').then((responseBody) => {
    const expectedAccessToken = responseBody.access_token.trim();
    const expectedIdToken = responseBody.id_token.trim();

    // Check the displayed access token matches what was returned from token endpoint
    cy.get(exampleAppHome.tokenField).eq(0).invoke('text').then((displayedAccessToken) => {
      const cleanedAccessToken = displayedAccessToken.trim().replace(/"/g, ''); // Remove any quotes
      expect(cleanedAccessToken).to.equal(expectedAccessToken);
    });

    // Check the id token matches what was returned from token endpoint
    cy.get(exampleAppHome.tokenField).eq(1).invoke('text').then((displayedIdToken) => {
      const cleanedIdToken = displayedIdToken.trim().replace(/"/g, ''); // Remove any quotes
      expect(cleanedIdToken).to.equal(expectedIdToken);
    });
  });
});

// TODO should probably be a unit test
Then('I confirm user info displayed by the client sdk is correct', () => {
  cy.get(exampleAppHome.userDataField).eq(0).invoke('text').then((accessTokenDataText) => {
    // Parse the text content as JSON
    const accessTokenData = JSON.parse(accessTokenDataText.trim());
    checkAccessTokenFields(accessTokenData);
  });

  cy.get(exampleAppHome.userDataField).eq(1).invoke('text').then((idTokenDataText) => {
    cy.get(exampleAppHome.forwardedTokensField).invoke('text').then((forwardedTokensText) => {
      // Parse the contents as JSON
      const idTokenData = JSON.parse(idTokenDataText.trim());
      const forwardedTokenData: ForwardedTokens = JSON.parse(forwardedTokensText.trim());

      assertDataFromSDKMatchesTokenContents(idTokenData, forwardedTokenData);
    });
  });
});

// TODO should probably be a unit test
Then('I confirm user info extracted from the tokens is correct', () => {
  cy.get(exampleAppHome.userDataField).eq(0).invoke('text').then((accessTokenDataText) => {
    // Parse the text content as JSON
    const accessTokenData = JSON.parse(accessTokenDataText.trim());
    checkAccessTokenFields(accessTokenData);
  });

  cy.get(exampleAppHome.userDataField).eq(1).invoke('text').then((idTokenDataText) => {
    cy.get(exampleAppHome.forwardedTokensField).invoke('text').then((forwardedTokensText) => {
      // Parse the contents as JSON
      const idTokenData = JSON.parse(idTokenDataText.trim());
      const forwardedTokenData: ForwardedTokens = JSON.parse(forwardedTokensText.trim());

      assertDataFromSDKMatchesTokenContents(idTokenData, forwardedTokenData);
    });
  });
});

When('I click the logout button', () => {
  // First click the dropdown container
  cy.get('#civic-dropdown-container').click();
  
  // Then find and click the Logout button within the dropdown
  cy.get('#civic-dropdown-container')
    .contains('button', 'Logout')
    .click();
});

Then('I confirm successful logout', () => {
  // Check we're back on the homepage
  cy.url().should('eq', `${Cypress.env('BASE_URL')}/`);

  // Wait for the access_token cookie to be cleared
  const waitForCookieToBeCleared = (cookieName, retries = 10) => {
    cy.getCookie(cookieName, { timeout: 10000 }).then((cookie) => {
      const token = cookie ? cookie.value : null;
      if (token !== null && token !== '') {
        if (retries > 0) {
          cy.wait(1000); // Wait for 1 second before retrying
          waitForCookieToBeCleared(cookieName, retries - 1); // Retry
        } else {
          throw new Error(`${cookieName} cookie was not cleared after waiting`);
        }
      }
    });
  };

  waitForCookieToBeCleared('access_token');
});

let storedRefreshToken: string;

When('I store the refresh token', () => {
  cy.getCookie('refresh_token').then((cookie) => {
    storedRefreshToken = cookie ? cookie.value : '';
    expect(storedRefreshToken).to.not.be.empty;
  });
});

Then('I confirm token refresh is successful', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('SERVER_URL')}/token`,
    form: true,
    body: {
      grant_type: 'refresh_token',
      refresh_token: storedRefreshToken,
      client_id: 'demo-client-1'
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('access_token');
  });
});

Then('I confirm token refresh fails after logout', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('SERVER_URL')}/token`,
    form: true,
    body: {
      grant_type: 'refresh_token',
      refresh_token: storedRefreshToken,
      client_id: 'demo-client-1'
    },
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(400);
  });
});


