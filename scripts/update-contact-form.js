#!/usr/bin/env node

/**
 * Update Contact Form with FormSubmit Integration
 *
 * This script helps update an existing contact.html to use FormSubmit
 */

const fs = require('fs');
const path = require('path');

const CONTACT_FILE = path.join(__dirname, '../site/contact.html');
const TEMPLATE_FILE = path.join(__dirname, '../site/contact-form-template.html');
const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/b3b8fa08e07860d7b35ea92e3681b10b';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log('\n╔═══════════════════════════════════════════════════╗', 'cyan');
  log('║      FormSubmit Contact Form Setup               ║', 'cyan');
  log('╚═══════════════════════════════════════════════════╝\n', 'cyan');

  // Check if contact.html exists
  if (!fs.existsSync(CONTACT_FILE)) {
    log('⚠ site/contact.html not found', 'yellow');
    log('\nOptions:', 'bold');
    log('  1. Import from cPanel first: npm run import:cpanel-live', 'cyan');
    log('  2. Use the template: cp site/contact-form-template.html site/contact.html\n', 'cyan');
    process.exit(0);
  }

  const content = fs.readFileSync(CONTACT_FILE, 'utf8');

  // Check current status
  const hasFormSubmit = content.includes('formsubmit.co');
  const hasCorrectEndpoint = content.includes(FORMSUBMIT_ENDPOINT);

  if (hasCorrectEndpoint) {
    log('✓ Contact form already configured correctly!', 'green');
    log(`  Endpoint: ${FORMSUBMIT_ENDPOINT}\n`, 'cyan');
    process.exit(0);
  }

  log('Current form status:', 'bold');
  if (hasFormSubmit) {
    log('  ⚠ Uses FormSubmit but with a different endpoint', 'yellow');
  } else {
    log('  ✗ Not using FormSubmit', 'red');
  }

  log('\n📝 Manual Update Required:', 'bold');
  log('  1. Open site/contact.html in your editor', 'cyan');
  log('  2. Find the <form> tag', 'cyan');
  log('  3. Update the action attribute to:', 'cyan');
  log(`     action="${FORMSUBMIT_ENDPOINT}"`, 'green');
  log('  4. Set method to POST:', 'cyan');
  log('     method="POST"', 'green');
  log('\n  5. Add these hidden fields inside the form:', 'cyan');
  log('     <input type="hidden" name="_subject" value="New contact inquiry from EngageGroovy">', 'green');
  log('     <input type="hidden" name="_captcha" value="false">', 'green');
  log('     <input type="hidden" name="_template" value="table">', 'green');
  log('     <input type="hidden" name="_next" value="https://engagegroovy.com/thank-you.html">', 'green');

  log('\n📋 Reference template available:', 'bold');
  log('  site/contact-form-template.html\n', 'cyan');

  log('After updating, verify with:', 'bold');
  log('  npm run verify:contact-form\n', 'cyan');
}

main();
