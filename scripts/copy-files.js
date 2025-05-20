const fs = require('fs');
const path = require('path');

// Create the dist directory if it doesn't exist
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Create the package.json for dist
const distPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  main: 'index.js',
  module: 'index.mjs',
  types: 'index.d.ts',
  license: packageJson.license,
  dependencies: packageJson.dependencies,
  repository: packageJson.repository,
  bugs: packageJson.bugs,
  homepage: packageJson.homepage,
};

// Create an ESM wrapper for CommonJS module
const esmWrapper = `
// This file serves as the entry point for ESM imports
export * from './index.js';
export { default } from './index.js';
`;

// Write files
fs.writeFileSync('./dist/package.json', JSON.stringify(distPackageJson, null, 2));
fs.writeFileSync('./dist/index.mjs', esmWrapper);

console.log('📦 Build completed successfully!');
console.log('📁 Files copied to dist folder'); 