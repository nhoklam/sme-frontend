const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Mock browser env
require('@babel/register')({
    presets: ['@babel/preset-env', ['@babel/preset-react', {runtime: 'automatic'}], '@babel/preset-typescript'],
    extensions: ['.ts', '.tsx', '.js', '.jsx']
});

try {
    const InventoryListTab = require('./src/modules/admin/pages/inventory/tabs/InventoryListTab').default;
    
    // We can't really render without mocking contexts, but let's just inspect the module exports.
    console.log("Exports of InventoryListTab:", Object.keys(require('./src/modules/admin/pages/inventory/tabs/InventoryListTab')));
} catch (e) {
    console.error("Error loading InventoryListTab:", e);
}
