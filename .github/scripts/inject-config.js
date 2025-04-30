#!/usr/bin/env node

// Add missing require statements
const fs = require('fs');
const path = require('path');

const [,, filePath] = process.argv;

if (!filePath) {
  console.error('❌ Error: Missing file path. Usage: node inject-config.js <filePath>');
  process.exit(1);
}

// Resolve the absolute path ONCE and use it consistently
const absolutePath = path.resolve(filePath);

if (!fs.existsSync(absolutePath)) {
  console.error(`❌ Error: File not found: ${absolutePath}`);
  process.exit(1);
}

const clientIdRegex = /(\s*)(clientId:\s*(?:[`'"]?\s*\$\{process\.env\.CLIENT_ID\}\s*[`'"]?)?)/;
const oauthServerRegex = /oauthServer:/;
const callbackUrlRegex = /callbackUrl:|redirectUrl:/;

try {
  let content = fs.readFileSync(absolutePath, 'utf8');
  let lines = content.split('\n');
  let modified = false;
  let inserted = false;

  // Find the index of the clientId line
  let clientIdIndex = -1;
  let indentation = '';
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(clientIdRegex);
    if (match) {
      clientIdIndex = i;
      indentation = match[1] || '';
      break;
    }
  }

  if (clientIdIndex !== -1) {
    let clientIdLine = lines[clientIdIndex];
    
    // 1. Add comma if needed
    if (!clientIdLine.trim().endsWith(',')) {
      lines[clientIdIndex] = clientIdLine.replace(/(clientId:.*)/, '$1,');
      modified = true;
      console.log(`   Added missing comma to clientId line in ${filePath}`);
    }

    // 2. Check if already inserted immediately after
    const nextLine = lines[clientIdIndex + 1] || '';
    if (!oauthServerRegex.test(nextLine)) {
      // 3. Insert using splice with environment variable reference
      const oauthLine = indentation + 'oauthServer: process.env.AUTH_SERVER,';
      
      lines.splice(clientIdIndex + 1, 0, oauthLine);
      console.log(`   Injected oauthServer into ${filePath}`);

      inserted = true;
      modified = true;
    } else {
      console.log(`   Skipping insertion: oauthServer seems already present after clientId.`);
    }
  } else {
    console.error('❌ Error: clientId line not found in the file');
    process.exit(1);
  }

  if (modified) {
    fs.writeFileSync(absolutePath, lines.join('\n'), 'utf8');
    console.log(`   File ${filePath} updated successfully`);
  } else {
    console.log(`   No changes made to ${filePath}`);
  }
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}