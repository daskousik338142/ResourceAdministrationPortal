import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import NBLList from './pages/NBLList';
import Admin from './pages/Admin';
import NewAllocations from './pages/NewAllocations';
import ResourceAllocationSummary from './pages/ResourceAllocationSummary';
import ResourceAllocationDashboard from './pages/ResourceAllocationDashboard';
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
          <Route path="/admin" element={<Admin />} />
          <Route path="/existing-allocations" element={<ResourceAllocationSummary />} />
          <Route path="/new-allocations" element={<NewAllocations />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
