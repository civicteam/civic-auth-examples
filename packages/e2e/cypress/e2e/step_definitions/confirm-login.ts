/// <reference types="cypress" />
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import 'cypress-iframe';

Given('I confirm solana login with wallet adapter', () => {
  cy.get('.wallet-adapter-button.wallet-adapter-button-trigger', { timeout: 60000 })
    .within(() => {
      cy.get('.wallet-adapter-button-start-icon').should('exist');
      cy.contains(/^[A-Za-z0-9]{4}\.\.([A-Za-z0-9]{4})$/);
    });

    cy.contains(/Wallet address: [A-Za-z0-9]{32,44}/).should('exist');
  cy.contains('Balance: 0 SOL').should('exist');
});

Then('I confirm solana login without wallet adapter', () => {
  cy.get('#civic-dropdown-container', { timeout: 60000 }).contains('button', 'Ghost').should('be.visible');
  cy.contains(/Wallet address: [A-Za-z0-9]{32,44}/).should('exist');
  cy.contains('Balance: 0 SOL').should('exist');
});

Then('I confirm ethereum login without wallet adapter', () => {
  cy.get('#civic-dropdown-container', { timeout: 60000 }).contains('button', 'Ghost').should('be.visible');
  cy.contains(/Wallet address: 0x[A-Fa-f0-9]{40}/).should('exist');
  cy.contains(/Balance: \d+(\.\d+)? ETH/).should('exist');
});