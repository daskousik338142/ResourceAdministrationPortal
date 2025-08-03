import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
const ResourceAllocationSummary = () => {
  const [allocationData, setAllocationData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [recordsPerPage, setRecordsPerPage] = useState(250);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [columnFilters, setColumnFilters] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const recordsPerPageOptions = [250, 500, 1000, 2000, 4000];
  // Function to load existing data from backend
  const loadExistingData = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAllocationData();
      if (response.data.success && response.data.data.length > 0) {
        const records = response.data.data;
        // Define the exact 30 business columns that should be displayed
        const PREDEFINED_BUSINESS_COLUMNS = [
          'CustomerID', 'CustomerName', 'AssociateID', 'AssociateName', 'Designation',
          'GradeDescription', 'DepartmentID', 'DepartmentName', 'ProjectID', 'ProjectName',
          'ProjectType', 'ProjectBillability', 'AllocationStartDate', 'AllocationEndDate',
          'AssociateBillability', 'AllocationStatus', 'AllocationPercentage', 'ProjectRole',
          'OperationRole', 'OffShoreOnsite', 'Country', 'City', 'LocationDescription',
          'ManagerID', 'ManagerName', 'SupervisorID', 'SupervisorName', 'BillabilityReason',
          'PrimaryStateTag', 'SecondaryStateTag'
        ];
        // Show all key-value pairs for first record
        Object.keys(records[0]).slice(0, 15).forEach(key => {
        });
        const firstRecord = records[0];
        // Only use predefined business columns that exist in the data
        const availableBusinessColumns = PREDEFINED_BUSINESS_COLUMNS.filter(col => 
          firstRecord.hasOwnProperty(col)
        );
        // Use only predefined business columns as headers
        const headerRow = availableBusinessColumns;
        // Convert records back to array format using only predefined columns
        const dataRows = records.map((record, recordIndex) => {
          const row = headerRow.map((header, headerIndex) => {
            const value = record[header];
            // Apply date formatting for date columns
            let formattedValue = value;
            if (isDateColumn(header) && value !== null && value !== undefined && value !== '') {
              formattedValue = formatDateToMMDDYYYY(value);
              if (recordIndex === 0) {
              }
            }
            if (recordIndex === 0) {
            }
            // Handle null/undefined values better - display as empty string but maintain data quality
            return (formattedValue === null || formattedValue === undefined) ? '' : formattedValue;
          });
          if (recordIndex === 0) {
          }
          return row;
        });
        if (dataRows.length > 0) {
        }
        // Filter out rows that are mostly empty (optional additional filtering)
        const qualityDataRows = dataRows.filter(row => {
          const nonEmptyValues = row.filter(cell => 
            cell !== null && cell !== undefined && cell !== '' && cell.toString().trim() !== ''
          );
          // Keep rows that have at least 15% non-empty values (less aggressive)
          return (nonEmptyValues.length / row.length) >= 0.15;
        });
        setHeaders(headerRow);
        setAllocationData(qualityDataRows); // Use filtered data instead of all data
        setFileName(records[0].file_name || 'Existing Data');
        setLastSaved(records[0].upload_timestamp ? new Date(records[0].upload_timestamp).toLocaleString() : null);
        // Initialize column visibility
        const initialVisibility = {};
        headerRow.forEach((header, index) => {
          initialVisibility[index] = true;
        });
        setVisibleColumns(initialVisibility);
        // Initialize column filters
        const initialFilters = {};
        headerRow.forEach((header, index) => {
          initialFilters[index] = '';
        });
        setColumnFilters(initialFilters);
      } else {
        setAllocationData([]);
        setHeaders([]);
        setFileName('');
        setLastSaved(null);
        setVisibleColumns({});
        setColumnFilters({});
      }
    } catch (error) {
      // Reset state on error
      setAllocationData([]);
      setHeaders([]);
      setFileName('');
      setLastSaved(null);
      setVisibleColumns({});
      setColumnFilters({});
    } finally {
      setIsLoading(false);
    }
  };
  // Load existing data on component mount
  useEffect(() => {
    loadExistingData();
  }, []);
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) {
      setIsDragActive(true);
    }
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag inactive if we're leaving the drop zone completely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragActive(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };
  const handleFile = async (file) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Please select a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }
    setIsLoading(true);
    setFileName(file.name);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          let workbook;
          if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            // Handle CSV files
            const csvData = data;
            workbook = XLSX.read(csvData, { type: 'string' });
          } else {
            // Handle Excel files
            workbook = XLSX.read(data, { type: 'array' });
          }
          // Look for "AllocationReport" tab first, then fallback to first sheet
          let sheetName = 'AllocationReport';
          if (!workbook.Sheets[sheetName]) {
            // Try variations of the name
            const sheetNames = workbook.SheetNames;
            const allocationReportSheet = sheetNames.find(name => 
              name.toLowerCase().includes('allocation') && name.toLowerCase().includes('report')
            );
            if (allocationReportSheet) {
              sheetName = allocationReportSheet;
            } else {
              sheetName = workbook.SheetNames[0];
            }
          }
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (jsonData.length === 0) {
            alert('The file appears to be empty');
            setIsLoading(false);
            return;
          }
          // Define the exact 30 business columns that should be processed
          const PREDEFINED_BUSINESS_COLUMNS = [
            'CustomerID', 'CustomerName', 'AssociateID', 'AssociateName', 'Designation',
            'GradeDescription', 'DepartmentID', 'DepartmentName', 'ProjectID', 'ProjectName',
            'ProjectType', 'ProjectBillability', 'AllocationStartDate', 'AllocationEndDate',
            'AssociateBillability', 'AllocationStatus', 'AllocationPercentage', 'ProjectRole',
            'OperationRole', 'OffShoreOnsite', 'Country', 'City', 'LocationDescription',
            'ManagerID', 'ManagerName', 'SupervisorID', 'SupervisorName', 'BillabilityReason',
            'PrimaryStateTag', 'SecondaryStateTag'
          ];
          // Extract headers and data
          const rawHeaderRow = jsonData[0];
          const rawDataRows = jsonData.slice(1).filter(row => {
            // Less aggressive filtering: row must have at least 15% non-empty values
            const nonEmptyValues = row.filter(cell => 
              cell !== null && 
              cell !== undefined && 
              cell !== '' && 
              cell.toString().trim() !== ''
            );
            return (nonEmptyValues.length / row.length) >= 0.15;
          });
          // Filter headers to only include predefined business columns
          const headerIndexMap = [];
          const filteredHeaders = [];
          rawHeaderRow.forEach((header, index) => {
            if (PREDEFINED_BUSINESS_COLUMNS.includes(header)) {
              filteredHeaders.push(header);
              headerIndexMap.push(index);
            }
          });
          const ignoredHeaders = rawHeaderRow.filter(header => !PREDEFINED_BUSINESS_COLUMNS.includes(header));
          // Filter data rows to only include predefined columns
          const dataRows = rawDataRows.map(row => {
            return headerIndexMap.map(index => row[index]);
          });
          // Prepare records for backend using only filtered headers
          const recordsForBackend = dataRows.map((row, index) => {
            const record = {};
            let mappedValues = 0;
            let emptyValues = 0;
            filteredHeaders.forEach((header, headerIndex) => {
              const cellValue = row[headerIndex];
              // Handle date formatting for date columns
              let processedValue = cellValue;
              if (isDateColumn(header) && cellValue !== null && cellValue !== undefined && cellValue !== '') {
                processedValue = formatDateToMMDDYYYY(cellValue);
                if (index === 0) {
                }
              }
              // Only set non-empty values, leave empty values as empty string
              if (processedValue !== null && processedValue !== undefined && processedValue !== '' && processedValue.toString().trim() !== '') {
                record[header] = processedValue;
                mappedValues++;
              } else {
                record[header] = ''; // Use empty string instead of null
                emptyValues++;
              }
              if (index === 0 && headerIndex < 10) {
              }
            });
            if (index === 0) {
            }
            return record;
          });
          // Send data to backend using filtered headers
          const uploadData = async () => {
            try {
              const response = await api.uploadAllocationData(recordsForBackend, file.name, filteredHeaders);
              if (response.data.success) {
                setLastSaved(new Date().toLocaleString());
                return true;
              } else {
                alert('Failed to save allocation data to server: ' + response.data.message);
                return false;
              }
            } catch (error) {
              alert('Error saving data to server: ' + error.message);
            }
          };
          // Also check for and process NewAllocations tab if it exists
          const processNewAllocationsTab = async () => {
            let newAllocationsSheetName = 'NewAllocations';
            if (!workbook.Sheets[newAllocationsSheetName]) {
              const sheetNames = workbook.SheetNames;
              const newAllocationsSheet = sheetNames.find(name => 
                name.toLowerCase().includes('new') && name.toLowerCase().includes('allocation')
              );
              if (newAllocationsSheet) {
                newAllocationsSheetName = newAllocationsSheet;
              } else {
                return;
              }
            }
            try {
              const newAllocationsWorksheet = workbook.Sheets[newAllocationsSheetName];
              const newAllocationsJsonData = XLSX.utils.sheet_to_json(newAllocationsWorksheet, { header: 1 });
              if (newAllocationsJsonData.length > 0) {
                const newAllocationsHeaderRow = newAllocationsJsonData[0];
                const newAllocationsDataRows = newAllocationsJsonData.slice(1).filter(row => {
                  // Less aggressive filtering: row must have at least 15% non-empty values
                  const nonEmptyValues = row.filter(cell => 
                    cell !== null && 
                    cell !== undefined && 
                    cell !== '' && 
                    cell.toString().trim() !== ''
                  );
                  return (nonEmptyValues.length / row.length) >= 0.15;
                });
                if (newAllocationsDataRows.length > 0) {
                  const newAllocationsRecords = newAllocationsDataRows.map((row, index) => {
                    const record = {};
                    newAllocationsHeaderRow.forEach((header, headerIndex) => {
                      const value = row[headerIndex];
                      // Only set non-empty values, leave empty values as empty string
                      if (value !== null && value !== undefined && value !== '' && value.toString().trim() !== '') {
                        record[header] = value;
                      } else {
                        record[header] = ''; // Use empty string instead of null
                      }
                    });
                    return record;
                  });
                  // Upload to NewAllocations database
                  const newAllocationsResponse = await api.uploadNewAllocations(newAllocationsRecords, file.name, newAllocationsHeaderRow);
                  if (newAllocationsResponse.data.success) {
                  } else {
                  }
                }
              }
            } catch (error) {
            }
          };
          await uploadData();
          await processNewAllocationsTab();
          // Show completion message with column filtering info
          const message = `File processed successfully!\n- AllocationReport data saved with ${filteredHeaders.length} valid columns\n- ${ignoredHeaders.length} columns ignored: ${ignoredHeaders.slice(0, 3).join(', ')}${ignoredHeaders.length > 3 ? '...' : ''}\n- ${workbook.Sheets['NewAllocations'] ? 'NewAllocations data saved to New Allocations Database' : 'NewAllocations tab not found'}`;
          alert(message);
          // Save filtered headers to backend for future use
          await api.saveAllocationHeaders(filteredHeaders);
          // Set state to use filtered data and headers
          setHeaders(filteredHeaders);
          setAllocationData(dataRows);
          setFileName(file.name);
          // Initialize column visibility
          const initialVisibility = {};
          filteredHeaders.forEach((header, index) => {
            initialVisibility[index] = true;
          });
          setVisibleColumns(initialVisibility);
          // Initialize column filters
          const initialFilters = {};
          filteredHeaders.forEach((header, index) => {
            initialFilters[index] = '';
          });
          setColumnFilters(initialFilters);
          // Reload data from database to ensure UI reflects persistent state
          await loadExistingData();
          setSearchTerm('');
          setSortConfig({ column: null, direction: null });
        } catch (parseError) {
          alert('Error parsing file: ' + parseError.message);
        } finally {
          setIsLoading(false);
        }
      };
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      alert('Error processing file: ' + error.message);
      setIsLoading(false);
    }
  };
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
    if (window.confirm('Are you sure you want to clear all allocation data? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        const response = await api.clearAllocationData();
        if (response.data.success) {
          // Reload from database to ensure UI reflects persistent state
          await loadExistingData();
        } else {
          alert('Failed to clear data: ' + response.data.message);
        }
      } catch (error) {
        alert('Error clearing data: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };
  // Memoized filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = allocationData;
    // Apply column filters
    Object.entries(columnFilters).forEach(([columnIndex, filterValue]) => {
      if (filterValue.trim()) {
        filtered = filtered.filter(row => {
          const cellValue = row[parseInt(columnIndex)] || '';
          return cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });
    // Apply global search
    if (searchTerm.trim()) {
      filtered = filtered.filter(row =>
        row.some(cell => 
          cell && cell.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
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
  }, [allocationData, columnFilters, searchTerm, sortConfig]);
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
      getPaginatedData().forEach(row => {
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
      <div className="upload-section">
        <div 
          className={`drop-zone ${isDragActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="drop-zone-content">
            {isLoading ? (
              <>
                <div className="upload-icon spinner">⌛</div>
                <p>Processing file...</p>
              </>
            ) : (
              <>
                <div className="upload-icon">📊</div>
                <p>Drag & drop your resource allocation file here, or click to browse</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="file-input"
                  id="file-upload"
                  disabled={isLoading}
                />
                <label htmlFor="file-upload" className="upload-button">
                  Choose File
                </label>
              </>
            )}
          </div>
        </div>
        {fileName && (
          <div className="file-info">
            <div className="file-details">
              <span>📄 {fileName}</span>
              <span className="record-count">({allocationData.length} total records)</span>
              {searchTerm && (
                <span className="filtered-count">({filteredAndSortedData.length} filtered)</span>
              )}
              {lastSaved && (
                <span className="last-saved">Last uploaded: {lastSaved}</span>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Data Table Section */}
      <div className="data-table-section">
        <div className="table-controls-header">
          <div className="table-tabs">
            <div className="table-tab-header active">
              <h3>Resource Allocation Data</h3>
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
                disabled={isLoading || allocationData.length === 0}
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
                                    }}
                                    title="Clear filter"
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
                  <div className="empty-state-icon">📊</div>
                  <h3>No Data Available</h3>
                  <p>Upload an Excel file with allocation data to get started.</p>
                </div>
              </div>
            )}
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
    </div>
  );
};
export default ResourceAllocationSummary;
