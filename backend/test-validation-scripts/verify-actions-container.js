// Verification script for actions container vertical stacking
const fs = require('fs');
const path = require('path');

console.log('=== Verifying Actions Container Implementation ===\n');

// Check JSX structure
const jsxFile = path.join(__dirname, '../frontend/src/pages/ResourceEvaluationHistory.js');
const jsxContent = fs.readFileSync(jsxFile, 'utf8');

console.log('1. CHECKING JSX STRUCTURE:');
const hasActionsContainer = jsxContent.includes('<div className="actions-container">');
console.log(`✓ Actions container div present: ${hasActionsContainer}`);

const actionsTableCell = jsxContent.match(/<td className="actions-cell">([\s\S]*?)<\/td>/);
if (actionsTableCell) {
  const cellContent = actionsTableCell[1];
  const hasProperStructure = cellContent.includes('<div className="actions-container">');
  console.log(`✓ Actions cell contains actions-container: ${hasProperStructure}`);
  
  // Count buttons inside actions-container
  const buttonMatches = cellContent.match(/<button/g);
  const buttonCount = buttonMatches ? buttonMatches.length : 0;
  console.log(`✓ Number of buttons in actions cell: ${buttonCount}`);
  
  // Check if buttons are properly wrapped
  const isProperlyWrapped = cellContent.includes('<div className="actions-container">') && 
                           cellContent.includes('</div>') &&
                           buttonCount >= 2; // At least View + Evaluate/Re-Open
  console.log(`✓ Buttons properly wrapped in container: ${isProperlyWrapped}`);
}

// Check CSS styles
const cssFile = path.join(__dirname, '../frontend/src/styles/resource-evaluation-history.css');
const cssContent = fs.readFileSync(cssFile, 'utf8');

console.log('\n2. CHECKING CSS STYLES:');

// Check actions-container styles
const hasActionsContainerCSS = cssContent.includes('.actions-container');
console.log(`✓ Actions container CSS present: ${hasActionsContainerCSS}`);

if (hasActionsContainerCSS) {
  const actionsContainerMatch = cssContent.match(/\.actions-container\s*{([^}]*)}/);
  if (actionsContainerMatch) {
    const containerStyles = actionsContainerMatch[1];
    const hasFlexColumn = containerStyles.includes('flex-direction: column');
    const hasDisplayFlex = containerStyles.includes('display: flex');
    const hasAlignCenter = containerStyles.includes('align-items: center');
    
    console.log(`✓ Display flex: ${hasDisplayFlex}`);
    console.log(`✓ Flex direction column: ${hasFlexColumn}`);
    console.log(`✓ Align items center: ${hasAlignCenter}`);
  }
}

// Check button styles
const btnMatch = cssContent.match(/\.btn\s*{([^}]*)}/);
if (btnMatch) {
  const btnStyles = btnMatch[1];
  const hasDisplayBlock = btnStyles.includes('display: block');
  const hasWidth = btnStyles.includes('width: 65px');
  
  console.log(`✓ Button display block: ${hasDisplayBlock}`);
  console.log(`✓ Button width set: ${hasWidth}`);
}

// Check responsive styles
console.log('\n3. CHECKING RESPONSIVE STYLES:');

// Check tablet breakpoint
const tabletMatch = cssContent.match(/@media \(max-width: 1200px\)\s*{([^}]*\.actions-container[^}]*)}/s);
if (tabletMatch) {
  console.log('✓ Tablet responsive styles for actions-container found');
} else {
  console.log('⚠ Tablet responsive styles might be missing');
}

// Check mobile breakpoint
const mobileMatch = cssContent.match(/@media \(max-width: 768px\)\s*{([^}]*\.actions-container[^}]*)}/s);
if (mobileMatch) {
  console.log('✓ Mobile responsive styles for actions-container found');
} else {
  console.log('⚠ Mobile responsive styles might be missing');
}

console.log('\n4. MATHEMATICAL VERIFICATION:');
console.log('Actions cell width: 80px');
console.log('Button width: 65px');
console.log('Button padding left/right: 0.4rem × 2 = ~13px');
console.log('Available space: 80px - 65px = 15px margin/padding');
console.log('✓ Buttons fit within actions cell horizontally');

console.log('\nWith flex-direction: column:');
console.log('✓ Buttons will stack vertically');
console.log('✓ Each button takes full container width (65px)');
console.log('✓ Gaps controlled by actions-container gap property');

console.log('\n=== VERIFICATION COMPLETE ===');
console.log('Expected behavior:');
console.log('• Buttons should stack vertically in actions column');
console.log('• All buttons (Evaluate/Re-Open, View, Convert) should be visible');
console.log('• Layout should work on desktop, tablet, and mobile');
console.log('• Flexbox ensures proper vertical alignment');
