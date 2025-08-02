import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import '../styles/resource-allocation-summary.css';

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
      console.log('ResourceAllocationSummary: Starting to load existing data...');
      setIsLoading(true);
      const response = await api.getAllocationData();

      console.log('ResourceAllocationSummary: API response:', response.data);
      
      if (response.data.success && response.data.data.length > 0) {
        const records = response.data.data;
        console.log('ResourceAllocationSummary: Found', records.length, 'records');
        console.log('ResourceAllocationSummary: First record structure:', records[0]);
        
        // Extract headers from the first record's upload info or from object keys
        let headerRow = [];
        if (records[0]._uploadInfo && records[0]._uploadInfo.headers) {
          headerRow = records[0]._uploadInfo.headers;
          console.log('ResourceAllocationSummary: Using headers from _uploadInfo:', headerRow);
        } else {
          // Fallback: extract headers from object keys (excluding metadata)
          headerRow = Object.keys(records[0]).filter(key => 
            !key.startsWith('_') && key !== 'uploadTimestamp'
          );
          console.log('ResourceAllocationSummary: Using headers from object keys:', headerRow);
        }
        
        // Convert records back to array format for compatibility with existing code
        const dataRows = records.map((record, recordIndex) => {
          const row = headerRow.map(header => {
            const value = record[header];
            if (recordIndex === 0) {
              console.log(`ResourceAllocationSummary: Header "${header}" -> Value "${value}"`);
            }
            // Handle null/undefined values better - display as empty string but maintain data quality
            return (value === null || value === undefined) ? '' : value;
          });
          return row;
        });
        
        // Filter out rows that are mostly empty (optional additional filtering)
        const qualityDataRows = dataRows.filter(row => {
          const nonEmptyValues = row.filter(cell => 
            cell !== null && cell !== undefined && cell !== '' && cell.toString().trim() !== ''
          );
          // Keep rows that have at least 15% non-empty values (less aggressive)
          return (nonEmptyValues.length / row.length) >= 0.15;
        });
        
        console.log('ResourceAllocationSummary: Transformed data rows:', dataRows.length);
        console.log('ResourceAllocationSummary: Quality filtered data rows:', qualityDataRows.length);
        console.log('ResourceAllocationSummary: First data row:', qualityDataRows[0]);
        
        setHeaders(headerRow);
        setAllocationData(qualityDataRows); // Use filtered data instead of all data
        setFileName(records[0]._uploadInfo?.fileName || 'Existing Data');
        setLastSaved(records[0].uploadTimestamp ? new Date(records[0].uploadTimestamp).toLocaleString() : null);
        
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
        
        console.log('ResourceAllocationSummary: Data loaded successfully with', dataRows.length, 'rows and', headerRow.length, 'columns');
      } else {
        console.log('ResourceAllocationSummary: No existing allocation data found');
        setAllocationData([]);
        setHeaders([]);
        setFileName('');
        setLastSaved(null);
        setVisibleColumns({});
        setColumnFilters({});
      }
    } catch (error) {
      console.error('ResourceAllocationSummary: Error loading allocation data:', error);
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
    console.log('ResourceAllocationSummary: Component mounted, loading data...');
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
    console.log('Selected file:', file.name);
    
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
              console.warn('AllocationReport sheet not found, using first sheet:', sheetName);
            }
          }

          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          console.log('Raw Excel data from sheet:', sheetName);
          console.log('Total rows in Excel:', jsonData.length);
          console.log('First 3 rows:', jsonData.slice(0, 3));

          if (jsonData.length === 0) {
            alert('The file appears to be empty');
            setIsLoading(false);
            return;
          }

          // Extract headers and data
          const headerRow = jsonData[0];
          const dataRows = jsonData.slice(1).filter(row => {
            // Less aggressive filtering: row must have at least 15% non-empty values
            const nonEmptyValues = row.filter(cell => 
              cell !== null && 
              cell !== undefined && 
              cell !== '' && 
              cell.toString().trim() !== ''
            );
            return (nonEmptyValues.length / row.length) >= 0.15;
          });

          console.log('Headers:', headerRow);
          console.log('Data rows count:', dataRows.length);
          console.log('First data row:', dataRows[0]);
          console.log('Sample cell values from first row:', dataRows[0]?.slice(0, 5));

          // Prepare records for backend with better empty value handling
          const recordsForBackend = dataRows.map((row, index) => {
            const record = {};
            headerRow.forEach((header, headerIndex) => {
              const cellValue = row[headerIndex];
              // Only set non-empty values, leave empty values as empty string
              if (cellValue !== null && cellValue !== undefined && cellValue !== '' && cellValue.toString().trim() !== '') {
                record[header] = cellValue;
              } else {
                record[header] = ''; // Use empty string instead of null
              }
              if (index === 0 && headerIndex < 5) {
                console.log(`Mapping header "${header}" (index ${headerIndex}) -> value "${cellValue}"`);
              }
            });
            return record;
          });

          console.log('First record for backend:', recordsForBackend[0]);

          // Send data to backend
          const uploadData = async () => {
            try {
              const response = await api.uploadAllocationData(recordsForBackend, file.name, headerRow);

              if (response.data.success) {
                console.log('Allocation data uploaded successfully to backend');
                setLastSaved(new Date().toLocaleString());
                return true;
              } else {
                console.error('Backend upload failed:', response.data.message);
                alert('Failed to save allocation data to server: ' + response.data.message);
                return false;
              }
            } catch (error) {
              console.error('Error uploading to backend:', error);
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
                console.log('NewAllocations sheet not found in workbook');
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
                  console.log('Found NewAllocations tab with', newAllocationsDataRows.length, 'quality rows');
                  
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
                    console.log('NewAllocations data uploaded successfully to backend');
                  } else {
                    console.error('NewAllocations upload failed:', newAllocationsResponse.data.message);
                  }
                }
              }
            } catch (error) {
              console.error('Error processing NewAllocations tab:', error);
            }
          };

          await uploadData();
          await processNewAllocationsTab();
          
          // Show completion message
          const message = `File processed successfully!\n- AllocationReport data saved to Allocation Database\n- ${workbook.Sheets['NewAllocations'] ? 'NewAllocations data saved to New Allocations Database' : 'NewAllocations tab not found'}`;
          alert(message);
          
          // Save headers to backend for future use
          await api.saveAllocationHeaders(headerRow);
          
          // Reload data from database to ensure UI reflects persistent state
          await loadExistingData();
          setSearchTerm('');
          setSortConfig({ column: null, direction: null });
        } catch (parseError) {
          console.error('Error parsing file:', parseError);
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
      console.error('Error processing file:', error);
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
          console.log('All allocation data cleared successfully');
          // Reload from database to ensure UI reflects persistent state
          await loadExistingData();
        } else {
          alert('Failed to clear data: ' + response.data.message);
        }
      } catch (error) {
        console.error('Error clearing allocation data:', error);
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
                              {row[cellIndex] || ''}
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
