// tests/setup.js
// Bootstrap: load frontend scripts into jsdom's window context

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendDir = join(__dirname, '..', 'frontend');

// Read script contents
const configCode = readFileSync(join(frontendDir, 'config.js'), 'utf-8');
const utilsCode = readFileSync(join(frontendDir, 'utils.js'), 'utf-8');
const messageCode = readFileSync(join(frontendDir, 'message.js'), 'utf-8');

// Create a jsdom instance with a minimal HTML document
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

// Execute scripts in order (they define window.Config, window.Utils, window.MessageDetail)
const script1 = document.createElement('script');
script1.textContent = configCode;
document.body.appendChild(script1);

const script2 = document.createElement('script');
script2.textContent = utilsCode;
document.body.appendChild(script2);

const script3 = document.createElement('script');
script3.textContent = messageCode;
document.body.appendChild(script3);

// Expose globals to all test files
global.window = window;
global.document = document;
global.Config = window.Config;
global.Utils = window.Utils;
global.MessageDetail = window.MessageDetail;

// Clean up DOM between tests
export function resetDOM() {
  // Remove all body content
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  // Clear localStorage
  window.localStorage.clear();
  // Clear any modal overlays
  const overlays = document.querySelectorAll('.modal');
  overlays.forEach((el) => el.remove());
}

// Run reset before each test
import { beforeAll, beforeEach } from 'vitest';
beforeEach(() => {
  resetDOM();
});
