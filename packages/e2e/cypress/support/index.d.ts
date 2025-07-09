/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    iframe(selector: string): Chainable<JQuery<HTMLElement>>;
    frameLoaded(selector: string): Chainable<void>;
    enter(selector: string): Chainable<JQuery<HTMLElement>>;
  }
} 