#!/usr/bin/env node

/**
 * Verify Contact Form Configuration
 *
 * Checks that site/contact.html uses the correct FormSubmit endpoint
 */

const fs = require('fs');
const path = require('path');

const CONTACT_FILE = path.join(__dirname, '../site/contact.html');
const EXPECTED_ENDPOINT = 'https://formsubmit.co/b3b8fa08e07860d7b35ea92e3681b10b';

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
  log('║      Contact Form Configuration Check            ║', 'cyan');
  log('╚═══════════════════════════════════════════════════╝\n', 'cyan');

  // Check if contact.html exists
  if (!fs.existsSync(CONTACT_FILE)) {
    log('⚠ WARNING: site/contact.html not found', 'yellow');
    log('  This file should be imported from cPanel.', 'yellow');
    log('  Run: npm run import:cpanel-live\n', 'yellow');
    process.exit(0);
  }

  // Read contact.html
  const content = fs.readFileSync(CONTACT_FILE, 'utf8');

  // Check for FormSubmit endpoint
  const hasFormSubmit = content.includes('formsubmit.co');
  const hasCorrectHash = content.includes('b3b8fa08e07860d7b35ea92e3681b10b');
  const hasCorrectEndpoint = content.includes(EXPECTED_ENDPOINT);

  log('Checking contact form configuration:\n', 'bold');

  if (hasFormSubmit) {
    log('✓ FormSubmit integration found', 'green');
  } else {
    log('✗ FormSubmit integration NOT found', 'red');
    log('  Expected: action="https://formsubmit.co/..."', 'yellow');
  }

  if (hasCorrectHash) {
    log('✓ Correct activation hash found', 'green');
  } else {
    log('✗ Activation hash NOT found or incorrect', 'red');
    log('  Expected hash: b3b8fa08e07860d7b35ea92e3681b10b', 'yellow');
  }

  if (hasCorrectEndpoint) {
    log('✓ Complete endpoint is correct', 'green');
  } else if (hasFormSubmit) {
    log('⚠ FormSubmit found but endpoint may be different', 'yellow');
  }

  // Extract form action
  const actionMatch = content.match(/action=["']([^"']+)["']/i);
  if (actionMatch) {
    log(`\n📋 Current form action:`, 'bold');
    log(`  ${actionMatch[1]}`, 'cyan');
  }

  // Check if activated
  log('\n📌 Activation Status:', 'bold');
  log('  Check your email for FormSubmit activation link', 'yellow');
  log('  Click "Activate Form" to enable submissions', 'yellow');

  // Summary
  if (hasCorrectEndpoint) {
    log('\n✅ Contact form is correctly configured!', 'green');
    log('   Make sure to activate via email link.\n', 'green');
  } else if (hasFormSubmit) {
    log('\n⚠ Contact form uses FormSubmit but endpoint differs', 'yellow');
    log('  Expected: ' + EXPECTED_ENDPOINT, 'yellow');
    log('  Update contact.html if needed.\n', 'yellow');
  } else {
    log('\n❌ Contact form needs FormSubmit configuration', 'red');
    log('  Update the form action to:', 'yellow');
    log('  ' + EXPECTED_ENDPOINT + '\n', 'yellow');
  }

  log('Documentation: site/CONTACT-FORM-CONFIG.md\n', 'cyan');
}

main();
