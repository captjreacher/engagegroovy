#!/usr/bin/env node

/**
 * Import cPanel Live Site
 *
 * Copies files from scratch/cpanel-live-import/ to site/
 * This makes site/ the source of truth for production deployment.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../scratch/cpanel-live-import');
const TARGET_DIR = path.join(__dirname, '../site');

// ANSI colors for terminal output
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

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function countFiles(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return 0;

  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  });
  return count;
}

function main() {
  log('\n╔═══════════════════════════════════════════════════╗', 'cyan');
  log('║   Import cPanel Live Site to Source of Truth     ║', 'cyan');
  log('╚═══════════════════════════════════════════════════╝\n', 'cyan');

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    log('✗ ERROR: Import directory not found!', 'red');
    log(`  Expected: ${SOURCE_DIR}`, 'yellow');
    log('\n  Please follow instructions in:', 'yellow');
    log('  scratch/cpanel-live-import/README.md\n', 'yellow');
    process.exit(1);
  }

  // Check if source has files
  const fileCount = countFiles(SOURCE_DIR);
  if (fileCount === 0) {
    log('✗ ERROR: Import directory is empty!', 'red');
    log(`  Location: ${SOURCE_DIR}`, 'yellow');
    log('\n  Please extract cPanel files into this directory.', 'yellow');
    log('  See: scratch/cpanel-live-import/README.md\n', 'yellow');
    process.exit(1);
  }

  log(`✓ Found ${fileCount} files in import directory`, 'green');

  // Verify expected files exist
  const requiredFiles = ['index.html'];
  const missingFiles = requiredFiles.filter(file =>
    !fs.existsSync(path.join(SOURCE_DIR, file))
  );

  if (missingFiles.length > 0) {
    log('\n⚠ WARNING: Some expected files are missing:', 'yellow');
    missingFiles.forEach(file => log(`  - ${file}`, 'yellow'));
    log('\n  Continuing anyway...\n', 'yellow');
  }

  // Clear target directory
  if (fs.existsSync(TARGET_DIR)) {
    log('→ Clearing existing site/ directory...', 'cyan');
    fs.rmSync(TARGET_DIR, { recursive: true, force: true });
  }

  // Create target directory
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  // Copy files
  log('→ Copying files from import directory to site/...', 'cyan');
  copyRecursive(SOURCE_DIR, TARGET_DIR);

  const copiedCount = countFiles(TARGET_DIR);
  log(`✓ Successfully copied ${copiedCount} files to site/`, 'green');

  // List what was copied
  log('\n📁 Files now in site/:', 'bold');
  const topLevelFiles = fs.readdirSync(TARGET_DIR);
  topLevelFiles.forEach(file => {
    const fullPath = path.join(TARGET_DIR, file);
    const stats = fs.statSync(fullPath);
    const icon = stats.isDirectory() ? '📂' : '📄';
    log(`  ${icon} ${file}`, 'cyan');
  });

  log('\n✓ Import complete!', 'green');
  log('\nNext steps:', 'bold');
  log('  1. Preview locally: npm run preview', 'cyan');
  log('  2. Commit changes: git add site/ && git commit -m "Import cPanel live site"', 'cyan');
  log('  3. Deploy: git push origin main\n', 'cyan');
}

main();
