import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import '../styles/resource-allocation-summary.css';
// Date formatting utility functions
const formatDateToMMDDYYYY = (dateValue) => {
  if (!dateValue || dateValue === '') return '';
  try {
    // Handle different input formats
    let date;
    // If it's already in MM/DD/YYYY format, return as is
    if (typeof dateValue === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
      return dateValue;
    }
    // If it's a string that looks like a date, try to parse it
    if (typeof dateValue === 'string') {
      // Handle Excel date serial numbers (if they come as strings)
      const numValue = parseFloat(dateValue);
      if (!isNaN(numValue) && numValue > 40000 && numValue < 60000) {
        // Excel date serial number (days since 1900-01-01)
        date = new Date((numValue - 25569) * 86400 * 1000);
      } else {
        // Try parsing as regular date string
        date = new Date(dateValue);
      }
    } else if (typeof dateValue === 'number') {
      // Handle Excel date serial numbers
      if (dateValue > 40000 && dateValue < 60000) {
        // Excel date serial number (days since 1900-01-01)
        date = new Date((dateValue - 25569) * 86400 * 1000);
      } else {
        // Assume it's a timestamp
        date = new Date(dateValue);
      }
    } else {
      date = new Date(dateValue);
    }
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateValue; // Return original value if can't parse
    }
    // Format as MM/DD/YYYY
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (error) {
    return dateValue; // Return original value if error
  }
};
const isDateColumn = (headerName) => {
  return headerName === 'AllocationStartDate' || headerName === 'AllocationEndDate';
};
const NewAllocations = () => {
  const [newAllocationsData, setNewAllocationsData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [fileName, setFileName] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [columnFilters, setColumnFilters] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const recordsPerPageOptions = [10, 20, 50, 100];
  // Function to load existing data from backend
  const loadExistingData = async () => {
    try {
      const response = await api.getNewAllocations();
      if (response.data.success && response.data.data.length > 0) {
        const records = response.data.data;
        
        console.log(`Loading ${records.length} new allocation records from backend`);
        
        const firstRecord = records[0];
        
        // Use ALL columns from the database record (matching ResourceAllocationSummary approach)
        const availableColumns = Object.keys(firstRecord).filter(col => 
          col !== 'id' && col !== 'created_at' && col !== 'updated_at'
        );
        
        console.log('Available columns:', availableColumns);
        
        // Convert records back to array format using all available columns
        const dataRows = records.map(record => {
          return availableColumns.map(header => {
            const value = record[header];
            // Apply date formatting for date columns
            let formattedValue = value;
            if (isDateColumn(header) && value !== null && value !== undefined && value !== '') {
              formattedValue = formatDateToMMDDYYYY(value);
            }
            // Handle null/undefined values - display as empty string
            return (formattedValue === null || formattedValue === undefined) ? '' : formattedValue;
          });
        });
        
        console.log(`Processed ${dataRows.length} data rows`);
        
        setHeaders(availableColumns);
        setNewAllocationsData(dataRows); // Use ALL data without filtering
        setFileName(records[0].file_name || 'Existing Data');
        setLastSaved(records[0].upload_timestamp ? new Date(records[0].upload_timestamp).toLocaleString() : null);
        
        // Initialize column visibility - show all columns
        const initialVisibility = {};
        availableColumns.forEach((header, index) => {
          initialVisibility[index] = true;
        });
        setVisibleColumns(initialVisibility);
        
        // Initialize column filters
        const initialFilters = {};
        availableColumns.forEach((header, index) => {
          initialFilters[index] = '';
        });
        setColumnFilters(initialFilters);
        
      } else {
        console.log('No new allocation data found in backend');
        setNewAllocationsData([]);
        setHeaders([]);
        setFileName('');
        setLastSaved(null);
        setVisibleColumns({});
        setColumnFilters({});
      }
    } catch (error) {
      console.error('Error loading new allocation data:', error);
      // Reset state on error
      setNewAllocationsData([]);
      setHeaders([]);
      setFileName('');
      setLastSaved(null);
      setVisibleColumns({});
      setColumnFilters({});
    }
  };
  // Load existing data on component mount
  useEffect(() => {
    loadExistingData();
  }, []);
  // Table functionality methods
  const handleSort = (columnIndex) => {
    let direction = 'asc';
    if (sortConfig.column === columnIndex && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column: columnIndex, direction });
  };
  const handleColumnFilter = (columnIndex, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };
  const clearColumnFilters = () => {
    const clearedFilters = {};
    headers.forEach((header, index) => {
      clearedFilters[index] = '';
    });
    setColumnFilters(clearedFilters);
    setCurrentPage(1);
  };
  const toggleColumnVisibility = (columnIndex) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnIndex]: !prev[columnIndex]
    }));
  };
  const showAllColumns = () => {
    const allVisible = {};
    headers.forEach((header, index) => {
      allVisible[index] = true;
    });
    setVisibleColumns(allVisible);
  };
  const hideAllColumns = () => {
    const allHidden = {};
    headers.forEach((header, index) => {
      allHidden[index] = false;
    });
    setVisibleColumns(allHidden);
  };
  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all new allocation data? This action cannot be undone.')) {
      try {
        const response = await api.clearNewAllocations();
        if (response.data.success) {
          // Reload from database to ensure UI reflects persistent state
          await loadExistingData();
        } else {
          alert('Failed to clear data: ' + response.data.message);
        }
      } catch (error) {
        alert('Error clearing data: ' + error.message);
      }
    }
  };
  // Memoized filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = newAllocationsData;
    // Apply column filters
    Object.entries(columnFilters).forEach(([columnIndex, filterValue]) => {
      if (filterValue.trim()) {
        filtered = filtered.filter(row => {
          const cellValue = row[parseInt(columnIndex)] || '';
          return cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });
    // Apply sorting
    if (sortConfig.column !== null) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.column] || '';
        const bValue = b[sortConfig.column] || '';
        // Try to parse as numbers first
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        // Fall back to string comparison
        const aStr = aValue.toString().toLowerCase();
        const bStr = bValue.toString().toLowerCase();
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [newAllocationsData, columnFilters, sortConfig]);
  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / recordsPerPage);
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  };
  // Calculate column widths based on content
  const columnWidths = useMemo(() => {
    if (headers.length === 0) return {};
    const widths = {};
    headers.forEach((header, index) => {
      // Start with header width
      let maxWidth = Math.max(header.length * 8, 80);
      // Check content width for visible data
      const startIndex = (currentPage - 1) * recordsPerPage;
      const endIndex = startIndex + recordsPerPage;
      const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);
      paginatedData.forEach(row => {
        if (row[index]) {
          const contentWidth = row[index].toString().length * 8;
          maxWidth = Math.max(maxWidth, contentWidth);
        }
      });
      // Set reasonable limits
      widths[index] = Math.min(Math.max(maxWidth, 100), 300);
    });
    return widths;
  }, [headers, filteredAndSortedData, currentPage, recordsPerPage]);
  return (
    <div className="resource-allocation-container">
      {/* Header Section */}
      <div className="header-section">
        <h2>New Allocations Data</h2>
        {fileName && (
          <div className="file-info">
            <div className="file-details">
              <span>📄 {fileName}</span>
              <span className="record-count">({newAllocationsData.length} total records)</span>
              {lastSaved && (
                <span className="last-saved">Last uploaded: {lastSaved}</span>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Data Table Section - Always show, even when empty */}
      <div className="data-table-section">
        <div className="table-controls-header">
          <div className="table-tabs">
            <div className="table-tab-header active">
              <h3>New Allocations Data</h3>
            </div>
            {headers.length > 0 && (
              <div className="table-tab-header column-visibility-tab">
                <div className="dropdown-container">
                  <button 
                    className="column-visibility-btn"
                    onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                  >
                    <span>Column Visibility</span>
                    <span className="dropdown-arrow">{showColumnDropdown ? '▲' : '▼'}</span>
                  </button>
                  {showColumnDropdown && (
                    <div className="column-dropdown">
                      <div className="dropdown-header">
                        <button onClick={showAllColumns} className="dropdown-action">Show All</button>
                        <button onClick={hideAllColumns} className="dropdown-action">Hide All</button>
                        <button onClick={clearColumnFilters} className="dropdown-action clear-filters">Clear Filters</button>
                      </div>
                      <div className="column-list">
                        {headers.map((header, index) => (
                          <label key={index} className="column-item">
                            <input
                              type="checkbox"
                              checked={visibleColumns[index] || false}
                              onChange={() => toggleColumnVisibility(index)}
                            />
                            <span className="column-name">{header}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="table-tab-header clear-data-tab">
              <button 
                className="clear-data-btn"
                onClick={clearAllData}
                disabled={newAllocationsData.length === 0}
              >
                <span>🗑️ Clear Data</span>
              </button>
            </div>
          </div>
          <div className="records-per-page-control">
              <label htmlFor="recordsPerPage">Records per page:</label>
              <select 
                id="recordsPerPage"
                value={recordsPerPage} 
                onChange={(e) => {
                  setRecordsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="records-select"
              >
                {recordsPerPageOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="table-container">
            <div className="table-wrapper">
              {headers.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      {headers.map((header, index) => 
                        visibleColumns[index] && (
                          <th 
                            key={index} 
                            className="table-header-cell sortable"
                            style={{ 
                              width: columnWidths[index] ? `${columnWidths[index]}px` : 'auto',
                              minWidth: columnWidths[index] ? `${columnWidths[index]}px` : 'fit-content'
                            }}
                          >
                            <div className="header-content">
                              <div className="header-text-sort" onClick={() => handleSort(index)}>
                                <span className="header-text">{header}</span>
                                <span className="sort-indicator">
                                  {sortConfig.column === index 
                                    ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                                    : '↕'
                                  }
                                </span>
                              </div>
                              <div className="filter-container">
                                <div className="filter-input-wrapper">
                                  <input
                                    type="text"
                                    placeholder={`Filter ${header}...`}
                                    value={columnFilters[index] || ''}
                                    onChange={(e) => handleColumnFilter(index, e.target.value)}
                                    className="column-filter-input"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  {columnFilters[index] && (
                                    <button
                                      className="clear-filter-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleColumnFilter(index, '');
                                      }}                                      title="Clear filter"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedData().length > 0 ? (
                      getPaginatedData().map((row, rowIndex) => (
                        <tr key={rowIndex} className="table-row">
                          {headers.map((header, cellIndex) => 
                            visibleColumns[cellIndex] && (
                              <td 
                                key={cellIndex} 
                                className="table-cell"
                                style={{ 
                                  width: columnWidths[cellIndex] ? `${columnWidths[cellIndex]}px` : 'auto',
                                  minWidth: columnWidths[cellIndex] ? `${columnWidths[cellIndex]}px` : 'fit-content'
                                }}
                              >
                                {isDateColumn(headers[cellIndex]) 
                                  ? formatDateToMMDDYYYY(row[cellIndex])
                                  : (row[cellIndex] || '')
                                }
                              </td>
                            )
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr className="table-row no-data-row">
                        <td 
                          colSpan={Object.values(visibleColumns).filter(Boolean).length} 
                          className="table-cell no-data-cell"
                        >
                          {filteredAndSortedData.length === 0 ? 'No data available' : 'No records match the current filters'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-state-icon">📋</div>
                    <h3>No Data Available</h3>
                    <p>Upload an Excel file with new allocation data to get started.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages} ({filteredAndSortedData.length} total records)
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  export default NewAllocations;
