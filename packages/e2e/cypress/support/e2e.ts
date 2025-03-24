// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on('uncaught:exception', (err) => {
  // Check if the error message contains any of these known errors
  if (
    err.message.includes('Minified React error #419') || 
    err.message.includes('Connection interrupted while trying to subscribe') ||
    err.message.includes('Hydration failed because the initial UI does not match')
  ) {
    // Return false to prevent Cypress from failing the test
    return false;
  }
  
  // Let other errors fail the test
  return true;
});