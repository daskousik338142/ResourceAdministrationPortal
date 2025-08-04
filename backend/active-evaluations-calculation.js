// Active Evaluations Card Calculation Breakdown
console.log('📊 ACTIVE EVALUATIONS CARD CALCULATION\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('                    🎯 CALCULATION LOGIC                       ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📋 BACKEND CALCULATION (resourceEvaluations.js):');
console.log('```javascript');
console.log('// Calculate active evaluations (where at least one status is not "pass")');
console.log('const activeEvaluations = evaluations.filter(e => ');
console.log('  e.internal_evaluation_status !== "pass" || e.client_evaluation_status !== "pass"');
console.log(');');
console.log('```\n');

console.log('🔍 BREAKDOWN OF THE LOGIC:');
console.log('   An evaluation is considered ACTIVE if:');
console.log('   • internal_evaluation_status ≠ "pass" OR');
console.log('   • client_evaluation_status ≠ "pass"');
console.log('   (OR condition means if either is not "pass", it\'s active)\n');

console.log('📊 EVALUATION SCENARIOS:');
console.log('\n✅ ACTIVE EVALUATIONS (counted):');
console.log('├── Internal: pending    | Client: pending    → ACTIVE');
console.log('├── Internal: pending    | Client: pass       → ACTIVE');
console.log('├── Internal: pending    | Client: fail       → ACTIVE');
console.log('├── Internal: pass       | Client: pending    → ACTIVE');
console.log('├── Internal: pass       | Client: fail       → ACTIVE');
console.log('├── Internal: fail       | Client: pending    → ACTIVE');
console.log('├── Internal: fail       | Client: pass       → ACTIVE');
console.log('├── Internal: fail       | Client: fail       → ACTIVE');
console.log('├── Internal: null       | Client: anything   → ACTIVE');
console.log('└── Internal: anything   | Client: null       → ACTIVE\n');

console.log('❌ INACTIVE EVALUATIONS (not counted):');
console.log('└── Internal: pass       | Client: pass       → NOT ACTIVE\n');

console.log('🎨 FRONTEND DISPLAY (ResourceEvaluationDashboard.js):');
console.log('```jsx');
console.log('<div className="summary-card active">');
console.log('  <div className="card-icon">⏳</div>');
console.log('  <div className="card-content">');
console.log('    <h3>Active Evaluations</h3>');
console.log('    <div className="card-value">{dashboardData.activeEvaluations}</div>');
console.log('  </div>');
console.log('</div>');
console.log('```\n');

console.log('📈 API DATA FLOW:');
console.log('1. Backend fetches all evaluations from database');
console.log('2. Filters evaluations using the OR condition');
console.log('3. Counts the filtered results: activeEvaluations.length');
console.log('4. Returns count in: data.activeEvaluations');
console.log('5. Frontend displays the count in the Active Evaluations card\n');

console.log('🔧 TECHNICAL DETAILS:');
console.log('• Database Query: SELECT * FROM resource_evaluations');
console.log('• Filter Function: Array.filter() with OR condition');
console.log('• Return Value: Integer count of active evaluations');
console.log('• Update Frequency: Real-time from database on page load\n');

console.log('💡 BUSINESS LOGIC:');
console.log('   Active = "Needs Attention"');
console.log('   • Any evaluation not fully passed by both sides');
console.log('   • Includes pending, failed, or incomplete evaluations');
console.log('   • Only both internal AND client "pass" = inactive\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('🎯 SUMMARY: Active Evaluations = Count of evaluations where');
console.log('   at least one status (internal OR client) is not "pass"');
console.log('═══════════════════════════════════════════════════════════════');
