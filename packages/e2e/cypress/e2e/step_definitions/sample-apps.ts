/// <reference types="cypress" />
import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';
import { loginApp, sampleApp } from '../../support/pages/elements';


Given('I open example app home page', () => {
  cy.intercept(Cypress.env('SERVER_URL') + '/.well-known/openid-configuration', (req) => {
    req.reply((res) => {
      if (res.statusCode === 200) {
        console.log('Request successful');
      }
    });
  }).as('openIdConfigRequest');

  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.visit(Cypress.env('BASE_URL'));

  cy.wait('@openIdConfigRequest').its('response.statusCode').should('eq', 200);
});

Given('I open sample next js example app home page', () => {
  cy.intercept(Cypress.env('SERVER_URL') + '/.well-known/openid-configuration', (req) => {
    req.reply((res) => {
      if (res.statusCode === 200) {
        console.log('Request successful');
      }
    });
  }).as('authRequest');

  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.visit(Cypress.env('SAMPLE_NEXT_JS_URL'));

  cy.wait('@authRequest').its('response.statusCode').should('eq', 200);
});

Given('I open sample react js example app home page', () => {
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
  cy.visit(Cypress.env('SAMPLE_REACT_JS_URL'));

  cy.wait('@authRequest').its('response.statusCode').should('eq', 200);
});

Then('I click the sign in button', () => {
  cy.get(sampleApp.signInButton)
    .should('have.text', 'Sign in')
    .should('not.be.disabled');

  cy.get(sampleApp.signInButton)
    .should('be.visible')
    .click();
});

Then('I fetch tokens from cookies', () => {
  const waitForCookie = (cookieName, retries = 10) => {
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

Then('I confirm cookie values change after a certain amount of time', () => {
  // Function to get initial cookie value
  function getInitialCookieValues(cookieNames: string[]): Cypress.Chainable<Record<string, string | null>> {
    const cookieValues: Record<string, string | null> = {};
  
    return cy.wrap(cookieNames).each((cookieName) => {
      return cy.getCookie(cookieName).then((cookie) => {
        const value = cookie ? cookie.value : null;
        if (value === null) {
          console.error(`Error: ${cookieName} is null in cookies`);
        }
        cookieValues[cookieName] = value;
      });
    }).then(() => cookieValues);
  }

  // Function to wait for a cookie value to change
  function waitForCookieChange(cookieName: string, initialValue: string | null) {
    if (initialValue === null) {
      console.error(`Error: Initial value for ${cookieName} is null`);
      return;
    }

    return cy.waitUntil(() => {
      return cy.getCookie(cookieName).then((cookie) => {
        const hasChanged = cookie ? cookie.value !== initialValue : false;
        console.log(`Checking ${cookieName}:`, cookie ? cookie.value : 'No cookie', 'Initial:', initialValue, 'Changed:', hasChanged);
        return hasChanged;
      });
    }, {
      timeout: 45000, // 45 seconds
      interval: 1000  // Check every 1000ms
    });
  }

  // Store initial cookie values and wait for changes
  getInitialCookieValues(['access_token', 'refresh_token', 'timestamp']).then((initialValues) => {
    waitForCookieChange('access_token', initialValues['access_token']);
    waitForCookieChange('refresh_token', initialValues['refresh_token']);
    waitForCookieChange('timestamp', initialValues['timestamp']);
  });
});

Then('I confirm local storage values change after a certain amount of time', () => {
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

  // Function to wait for a local storage value to change
  function waitForLocalStorageChange(key: string, initialValue: string) {
    return cy.waitUntil(() => {
      return cy.window().then((window) => {
        const currentValue = window.localStorage.getItem(key);
        const hasChanged = currentValue !== initialValue;
        console.log(`Checking ${key}: Current Value:`, currentValue, 'Initial:', initialValue, 'Changed:', hasChanged);
        return hasChanged; // Return true when the value has changed
      });
    }, {
      timeout: 60000, // 60 seconds
      interval: 1000   // Check every 1000ms
    });
  }

  // Wait for each key to be set, then capture initial values and wait for changes
  cy.window().then(async (window) => {
    const initialValues: Record<string, string> = {};

    // Wait for each key to be set and ensure they are not null
    for (const key of tokenKeys) {
      await waitForLocalStorageToBeSet(key); // Wait for the key to be set
      initialValues[key] = window.localStorage.getItem(key) as string; // Capture the initial value
      console.log(`Captured initial value for ${key}:`, initialValues[key]);

      // Ensure the initial value is not null
      if (initialValues[key] === null) {
        console.error(`Initial value for ${key} is null. Waiting for it to be set...`);
        await waitForLocalStorageToBeSet(key); // Wait again if it's null
        initialValues[key] = window.localStorage.getItem(key) as string; // Capture the value again
      }
    }

    // Now wait for changes for all keys in parallel
    const changePromises = tokenKeys.map((key) => {
      return waitForLocalStorageChange(key, initialValues[key]);
    });

    // Wait for all change checks to complete
    return Promise.all(changePromises).then(() => {
      console.log('All local storage values have changed.');
    });
  });
});

