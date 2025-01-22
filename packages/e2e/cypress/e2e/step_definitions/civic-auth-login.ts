/// <reference types="cypress" />
import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';
import { loginApp } from '../../support/pages/elements';

Given('I open the {string} app home page', (appType: string) => {
  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.visit(Cypress.env(`${appType}_BASE_URL`))
});

Given('I open login app home page and confirm assets have loaded correctly', () => {
  let failedRequests = [];
  
  cy.intercept('GET', '**/*.svg', (req) => {
    if (req.response) {
      const hasSvgContent = 
        req.response.body && 
        typeof req.response.body === 'string' && 
        req.response.body.includes('<svg');

      if (!hasSvgContent) {
        failedRequests.push({
          url: req.url,
          body: req.response.body?.substring(0, 100)
        });
        console.log(`Invalid SVG response for ${req.url}:`, req.response.body);
      }
    }
  }).as('svgRequests')
  
  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.visit(Cypress.env('LOGIN_APP_URL'));

  // confirm that each svg request actually returns an svg
  cy.get('@svgRequests.all').then((interceptions) => {
    interceptions.forEach(intercept => {
      const response = intercept.response.body;
      if (!response || !response.includes('<svg')) {
        failedRequests.push({
          url: intercept.request.url,
          body: response
        });
      }
    });

    // This should pass with valid SVG content
    expect(failedRequests).to.be.empty;
  })
});

Then('I confirm that login-app user is on the correct url', () => {
  cy.url().should('match', new RegExp(`${Cypress.env('LOGIN_APP_URL')}/user`));
});

Then('I confirm that login-app user is redirected to the dashboard home', () => {
  cy.url().should('include', `${Cypress.env('LOGIN_APP_URL')}/dashboard/api/session?redirectTo=%2Fhome`);
  cy.url().should('include', `${Cypress.env('LOGIN_APP_URL')}/dashboard/home/new-account`);
});

// TODO: Make unit test and delete this whole step
Then('I confirm user info displayed in login app is correct', () => {
  cy.get(loginApp.userDataField)
    .invoke('text')
    .then((loginAppUserDataText) => {
      const userData = JSON.parse(loginAppUserDataText);

      // Confirm dynamic data

      // Assert that "value" is not undefined or empty
      expect(userData.value).to.not.be.undefined;
      expect(userData.value).to.not.equal('');

      // Assert that "id_token" is not undefined or empty
      expect(userData.payload.forwardedTokens.dummy.id_token).to.not.be.undefined;
      expect(userData.payload.forwardedTokens.dummy.id_token).to.not.equal('');

      // Assert that "parts" is not undefined or empty and is an array
      expect(userData.parts).to.not.be.undefined;
      expect(userData.parts).to.be.an('array').that.is.not.empty;

      // Confirm "parts" matches "value" split by "."
      const valueParts = userData.value.split('.');
      expect(userData.parts).to.have.lengthOf(3);
      expect(userData.parts).to.deep.equal(valueParts);

      // Confirm static data
      expect(userData.header.alg).to.deep.equal('HS256');
      expect(userData.header.typ).to.deep.equal('JWT');

      expect(userData.payload.email).to.contains('@example.example'); // Static check for email

      expect(userData.payload.scopes).to.deep.equal(['openid', 'email', 'profile', 'forwardedTokens', 'offline_access']);
      expect(userData.payload.forwardedTokens.dummy.access_token).to.equal('');
      expect(userData.algorithm).to.equal('HS256');
      expect(userData.expiresAt).to.be.null;

      expect(userData.issuedAt).to.be.null;
      expect(userData.issuer).to.be.null;
      expect(userData.jwtId).to.be.null;

      expect(userData.notBefore).to.be.null;
    });
});
