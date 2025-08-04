console.log('🔍 DIAGNOSING ACTION BUTTONS VISIBILITY ISSUES\n');

console.log('📋 CURRENT BUTTON LAYOUT SPECS:\n');

console.log('📐 Button Dimensions:');
console.log('   • Evaluate: 42px width, 0.2rem padding, 0.55rem font');
console.log('   • View: 32px width, 0.2rem padding, 0.55rem font');
console.log('   • Convert: 42px width, 0.2rem padding, 0.55rem font');
console.log('   • Margin between buttons: 0.03rem each side');
console.log('   • Total estimated width: ~130-150px for 3 buttons\n');

console.log('📊 Column Specifications:');
console.log('   • Actions column width: 240px');
console.log('   • Actions cell min-width: 240px');
console.log('   • Cell padding: 0.5rem 0.1rem');
console.log('   • Available space for buttons: ~220px\n');

console.log('🎯 POTENTIAL ISSUES TO CHECK:\n');

console.log('1. BROWSER ZOOM LEVEL:');
console.log('   • Check if browser is zoomed > 100%');
console.log('   • Reset zoom to 100% (Ctrl+0)');
console.log('   • High zoom levels can cause layout issues\n');

console.log('2. CONTAINER WIDTH CONSTRAINTS:');
console.log('   • Page container might have width limits');
console.log('   • Parent elements may be constraining table width');
console.log('   • Check for CSS max-width properties\n');

console.log('3. BROWSER WINDOW SIZE:');
console.log('   • Table min-width: 1370px');
console.log('   • If screen/window < 1370px, horizontal scroll should appear');
console.log('   • Check if scroll is working properly\n');

console.log('4. CSS CONFLICTS:');
console.log('   • Other CSS rules might be overriding button styles');
console.log('   • Check browser dev tools for style conflicts');
console.log('   • Inspect element to see actual computed styles\n');

console.log('5. FLEXBOX/GRID ISSUES:');
console.log('   • Check if table cell is using flex or grid');
console.log('   • Ensure white-space: nowrap is working');
console.log('   • Verify overflow: visible is applied\n');

console.log('🔧 TROUBLESHOOTING STEPS:\n');

console.log('Step 1: Browser Dev Tools Check');
console.log('   • Right-click on actions cell → Inspect Element');
console.log('   • Check computed width of .actions-cell');
console.log('   • Verify button widths and margins');
console.log('   • Look for any red/strikethrough CSS rules\n');

console.log('Step 2: Console Check');
console.log('   • Open browser console (F12)');
console.log('   • Check for any JavaScript errors');
console.log('   • Verify React component is rendering correctly\n');

console.log('Step 3: Layout Verification');
console.log('   • Measure actual button widths in dev tools');
console.log('   • Check if buttons are wrapping to new lines');
console.log('   • Verify horizontal scroll appears if needed\n');

console.log('📱 RESPONSIVE BEHAVIOR:');
console.log('   • Desktop (>1370px): All buttons should be visible');
console.log('   • Tablet/Mobile: Horizontal scroll with all buttons');
console.log('   • Check different screen resolutions\n');

console.log('🎯 QUICK FIXES TO TRY:\n');

console.log('If buttons still not visible:');
console.log('   1. Increase actions column to 260px');
console.log('   2. Reduce button font-size to 0.5rem');
console.log('   3. Remove button text and use icons only');
console.log('   4. Stack buttons vertically in narrow cells');
console.log('   5. Add ellipsis overflow for button text\n');

console.log('📊 CURRENT IMPLEMENTATION STATUS:');
console.log('   ✅ Button sequence: Evaluate → View → Convert');
console.log('   ✅ Compact button sizing applied');
console.log('   ✅ Increased actions column width');
console.log('   ✅ Responsive design with scroll hints');
console.log('   ❓ Visibility issue may be browser/zoom related\n');

console.log('🚀 Next step: Check browser dev tools for actual measurements!');
