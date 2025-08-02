import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ResourceAllocationDashboard from './pages/ResourceAllocationDashboard';
import NBLList from './pages/NBLList';
import ResourceAllocationSummary from './pages/ResourceAllocationSummary';
import NewAllocations from './pages/NewAllocations';
import ResourceEvaluation from './pages/ResourceEvaluation';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resource-allocation-dashboard" element={<ResourceAllocationDashboard />} />
          <Route path="/nbl-list" element={<NBLList />} />
          <Route path="/resource-allocation-summary" element={<ResourceAllocationSummary key="existing-allocations" />} />
          <Route path="/new-allocations" element={<NewAllocations key="new-allocations" />} />
          <Route path="/resource-evaluation" element={<ResourceEvaluation />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
