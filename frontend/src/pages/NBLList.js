import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { format, parse, isValid } from 'date-fns';
import api from '../services/api';
import '../styles/nbl-list.css';

const NBLList = () => {
  const [excelData, setExcelData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [columnFilters, setColumnFilters] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [recordIds, setRecordIds] = useState([]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Helper function to check if a column contains dates
  const isDateColumn = (header) => {
    if (!header) return false;
    const lowerHeader = header.toLowerCase();
    return lowerHeader.includes('assignment start date') || 
           lowerHeader.includes('billable') || 
           lowerHeader.includes('release date') ||
           lowerHeader === 'assignment start date' ||
           lowerHeader === 'billable/ release date(mm/dd/yyyy)';
  };

  // Helper function to check if a column is NBL Category
  const isNBLCategoryColumn = (header) => {
    if (!header) return false;
    const lowerHeader = header.toLowerCase();
    return lowerHeader === 'nbl category';
  };

  // NBL Category dropdown options
  const nblCategoryOptions = [
    'NBL for the month',
    'Awaiting billing', 
    'Billed',
    'NBL'
  ];

  // Helper function to convert MM/DD/YYYY to YYYY-MM-DD for date input
  const convertToDateInputFormat = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parsedDate = parse(dateStr, 'MM/dd/yyyy', new Date());
      if (isValid(parsedDate)) {
        return format(parsedDate, 'yyyy-MM-dd');
      }
    } catch (error) {
      console.warn('Error converting date:', dateStr, error);
    }
    return '';
  };

  // Helper function to convert YYYY-MM-DD to MM/DD/YYYY
  const convertFromDateInputFormat = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        return format(parsedDate, 'MM/dd/yyyy');
      }
    } catch (error) {
      console.warn('Error converting date:', dateStr, error);
    }
    return '';
  };

  // Function to load existing data from backend
  const loadExistingData = async () => {
    try {
      setIsLoading(true);
      const response = await api.getNBLList();

      console.log('response.data:', response.data);
      
      if (response.data.success && response.data.data.length > 0) {
        const records = response.data.data;
        
        // Extract headers from the first record's upload info or from object keys
        let headerRow = [];
        if (records[0]._uploadInfo && records[0]._uploadInfo.headers) {
          headerRow = records[0]._uploadInfo.headers;
        } else {
          // Fallback: extract headers from object keys (excluding metadata)
          headerRow = Object.keys(records[0]).filter(key => 
            !key.startsWith('_') && key !== 'uploadTimestamp'
          );
        }
        
        // Convert records back to array format for compatibility with existing code
        const dataRows = records.map(record => {
          return headerRow.map(header => record[header]);
        });
        
        // Store record IDs for backend updates
        const ids = records.map(record => record._id);
        setRecordIds(ids);
        
        setHeaders(headerRow);
        setExcelData(dataRows);
        
        // Set filename from upload info if available
        if (records[0]._uploadInfo) {
          setFileName(records[0]._uploadInfo.fileName);
          setLastSaved(new Date(records[0]._uploadInfo.uploadTimestamp).toLocaleString());
        }
        
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
        // No data exists, try to load saved headers
        const savedHeaders = await loadSavedHeaders();
        if (savedHeaders && savedHeaders.length > 0) {
          console.log('No data found, but using saved headers:', savedHeaders);
          setHeaders(savedHeaders);
          
          // Initialize column visibility for saved headers
          const initialVisibility = {};
          savedHeaders.forEach((header, index) => {
            initialVisibility[index] = true;
          });
          setVisibleColumns(initialVisibility);
          
          // Initialize column filters for saved headers
          const initialFilters = {};
          savedHeaders.forEach((header, index) => {
            initialFilters[index] = '';
          });
          setColumnFilters(initialFilters);
        }
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      // Don't show alert for this error as it might be expected (no data exists yet)
    } finally {
      setIsLoading(false);
    }
  };

  // Reload data from database after upload
  const reloadDataFromDatabase = async () => {
    try {
      const response = await api.getNBLList();

      if (response.data.success && response.data.data.length > 0) {
        const records = response.data.data;
        
        // Extract headers from the first record's upload info or from object keys
        let headerRow = [];
        if (records[0]._uploadInfo && records[0]._uploadInfo.headers) {
          headerRow = records[0]._uploadInfo.headers;
        } else {
          // Fallback: extract headers from object keys (excluding metadata)
          headerRow = Object.keys(records[0]).filter(key => 
            !key.startsWith('_') && key !== 'uploadTimestamp'
          );
        }
        
        // Convert records back to array format for display
        const dataRows = records.map(record => {
          return headerRow.map(header => record[header] || '');
        });
        
        // Store record IDs for backend updates
        const ids = records.map(record => record._id);
        setRecordIds(ids);
        
        setHeaders(headerRow);
        setExcelData(dataRows);
        
        // Set filename from upload info if available
        if (records[0]._uploadInfo) {
          setFileName(records[0]._uploadInfo.fileName);
          setLastSaved(new Date(records[0]._uploadInfo.uploadTimestamp).toLocaleString());
        }
        
        // Update column visibility
        const initialVisibility = {};
        headerRow.forEach((header, index) => {
          initialVisibility[index] = true;
        });
        setVisibleColumns(initialVisibility);
        
        // Update column filters
        const initialFilters = {};
        headerRow.forEach((header, index) => {
          initialFilters[index] = '';
        });
        setColumnFilters(initialFilters);
        
        console.log(`Reloaded ${records.length} records from database`);
      }
    } catch (error) {
      console.error('Error reloading data from database:', error);
    }
  };

  // Load existing data on component mount
  useEffect(() => {
    loadExistingData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowColumnDropdown(false);
      }
    };

    if (showColumnDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showColumnDropdown]);

  const handleFileUpload = useCallback((file) => {
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 0) {
          const headerRow = jsonData[0];
          const dataRows = jsonData.slice(1).filter(row => 
            row.some(cell => cell !== null && cell !== undefined && cell !== '')
          );
          
          // Convert dataRows to object format for backend storage
          const recordsForBackend = dataRows.map(row => {
            const record = {};
            headerRow.forEach((header, index) => {
              record[header] = row[index] || '';
            });
            return record;
          });

          // Send data to backend and reload from database
          const uploadData = async () => {
            try {
              const response = await api.uploadNBLData(recordsForBackend, file.name, headerRow);

              if (response.data.success) {
                console.log('Data uploaded successfully to backend');
                setLastSaved(new Date().toLocaleString());
                
                // After successful upload, reload data from database to ensure consistency
                await reloadDataFromDatabase();
                
              } else {
                console.error('Backend upload failed:', response.data.message);
                alert('Failed to save data to server: ' + response.data.message);
              }
            } catch (error) {
              console.error('Error uploading to backend:', error);
              alert('Error saving data to server: ' + error.message);
            }
          };

          uploadData();
          
          // Save headers to backend for future use
          saveHeadersToBackend(headerRow);
          
          // Don't set local state here - let reloadDataFromDatabase handle it
          // This ensures data consistency with what's actually stored in the database
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please make sure it\'s a valid Excel file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let data = [...excelData];

    // Apply search filter
    if (searchTerm) {
      data = data.filter(row => 
        row.some(cell => 
          cell && cell.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.keys(columnFilters).forEach(columnIndex => {
      const filterValue = columnFilters[columnIndex];
      if (filterValue) {
        data = data.filter(row => {
          const cellValue = row[columnIndex];
          return cellValue && cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig.column !== null) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.column] || '';
        const bVal = b[sortConfig.column] || '';
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [excelData, searchTerm, sortConfig, columnFilters]);

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  };

  const paginatedData = getPaginatedData();
  const totalPages = Math.ceil(filteredAndSortedData.length / recordsPerPage);

  const handleColumnFilter = (columnIndex, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }));
    setCurrentPage(1);
  };

  const clearColumnFilters = () => {
    const clearedFilters = {};
    headers.forEach((header, index) => {
      clearedFilters[index] = '';
    });
    setColumnFilters(clearedFilters);
    setCurrentPage(1);
  };

  const handleSort = (columnIndex) => {
    setSortConfig(prev => ({
      column: columnIndex,
      direction: prev.column === columnIndex && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.\n\nNote: Table headers will be preserved for future uploads.')) {
      try {
        setIsLoading(true);
        const response = await api.clearNBLData();
        if (response.data.success) {
          // Clear data but preserve headers
          setExcelData([]);
          setFileName('');
          setLastSaved(null);
          setRecordIds([]);
          setSearchTerm('');
          setSortConfig({ column: null, direction: null });
          setCurrentPage(1);
          
          // Reset column filters but keep headers and visibility
          const clearedFilters = {};
          headers.forEach((header, index) => {
            clearedFilters[index] = '';
          });
          setColumnFilters(clearedFilters);
          
          alert(response.data.message || 'Data cleared successfully. Headers preserved for future uploads.');
        } else {
          alert('Failed to clear data: ' + (response.data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startEditing = (rowIndex, cellIndex) => {
    const actualRowIndex = (currentPage - 1) * recordsPerPage + rowIndex;
    const currentValue = excelData[actualRowIndex]?.[cellIndex] || '';
    setEditingCell({ row: rowIndex, col: cellIndex, actualRow: actualRowIndex });
    
    // If it's a date column, convert to date input format
    if (isDateColumn(headers[cellIndex])) {
      setEditingValue(convertToDateInputFormat(currentValue));
    } else {
      setEditingValue(currentValue);
    }
  };

  const stopEditing = async () => {
    if (editingCell) {
      const newData = [...excelData];
      if (newData[editingCell.actualRow]) {
        // Convert date value back to MM/DD/YYYY format if it's a date column
        let valueToStore = editingValue;
        if (isDateColumn(headers[editingCell.col])) {
          valueToStore = convertFromDateInputFormat(editingValue);
        }
        
        newData[editingCell.actualRow][editingCell.col] = valueToStore;
        setExcelData(newData);
        
        // Update backend
        try {
          const recordId = recordIds[editingCell.actualRow];
          if (recordId) {
            const updatedRecord = {};
            headers.forEach((header, index) => {
              updatedRecord[header] = newData[editingCell.actualRow][index];
            });
            
            await api.updateNBLRecord(recordId, updatedRecord);
            setLastSaved(new Date().toLocaleString());
          }
        } catch (error) {
          console.error('Error updating record:', error);
          alert('Failed to save changes to server');
        }
      }
    }
    setEditingCell(null);
    setEditingValue('');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const toggleColumnVisibility = (columnIndex) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnIndex]: !prev[columnIndex]
    }));
  };

  const showAllColumns = () => {
    const newVisibility = {};
    headers.forEach((header, index) => {
      newVisibility[index] = true;
    });
    setVisibleColumns(newVisibility);
  };

  const hideAllColumns = () => {
    const newVisibility = {};
    headers.forEach((header, index) => {
      newVisibility[index] = false;
    });
    setVisibleColumns(newVisibility);
  };

  const getVisibleHeaders = () => {
    return headers.filter((header, index) => visibleColumns[index]);
  };

  const getVisibleCellsForRow = (row) => {
    return row.filter((cell, index) => visibleColumns[index]);
  };

  const recordsPerPageOptions = [20, 40, 60, 80, 100];

  // Function to calculate optimal column widths based on content
  const calculateColumnWidths = useCallback(() => {
    if (!headers.length || !excelData.length) return {};
    
    const columnWidths = {};
    
    headers.forEach((header, index) => {
      // Calculate width based on header length
      let maxWidth = header.length * 8 + 32; // Base calculation: 8px per character + padding
      
      // Check data lengths in this column
      excelData.forEach(row => {
        const cellContent = row[index] || '';
        const cellWidth = cellContent.toString().length * 7 + 32; // 7px per character + padding
        maxWidth = Math.max(maxWidth, cellWidth);
      });
      
      // Set reasonable min and max bounds
      maxWidth = Math.max(80, Math.min(300, maxWidth));
      columnWidths[index] = maxWidth;
    });
    
    return columnWidths;
  }, [headers, excelData]);

  const columnWidths = useMemo(() => calculateColumnWidths(), [calculateColumnWidths]);

  // Function to load saved headers
  const loadSavedHeaders = async () => {
    try {
      const response = await api.getSavedHeaders();
      if (response.data.success && response.data.headers) {
        console.log('Found saved headers:', response.data.headers);
        return response.data.headers;
      }
    } catch (error) {
      console.error('Error loading saved headers:', error);
    }
    return null;
  };

  // Function to save headers
  const saveHeadersToBackend = async (headers) => {
    try {
      await api.saveHeaders(headers);
      console.log('Headers saved successfully');
    } catch (error) {
      console.error('Error saving headers:', error);
    }
  };

  return (
    <div className="nbl-list-container">
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
                <div className="upload-icon">📁</div>
                <p>Drag & drop your Excel file here, or click to browse</p>
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
              <span className="record-count">({excelData.length} total records)</span>
              {searchTerm && (
                <span className="filtered-count">({filteredAndSortedData.length} filtered)</span>
              )}
              {lastSaved && (
                <span className="last-saved">Last edited: {lastSaved}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Table Section */}
      {excelData.length > 0 && (
        <div className="data-table-section">
          <div className="table-controls-header">
            <div className="table-tabs">
              <div className="table-tab-header active">
                <h3>NBL List</h3>
              </div>
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
              <div className="table-tab-header clear-data-tab">
                <button 
                  className="clear-data-btn"
                  onClick={clearAllData}
                  disabled={isLoading || excelData.length === 0}
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
                              onClick={() => (isDateColumn(headers[cellIndex]) || isNBLCategoryColumn(headers[cellIndex])) ? startEditing(rowIndex, cellIndex) : null}
                            >
                              {editingCell && 
                               editingCell.row === rowIndex && 
                               editingCell.col === cellIndex ? (
                                <div className="cell-editor">
                                  {isDateColumn(headers[cellIndex]) ? (
                                    <input
                                      type="date"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onBlur={stopEditing}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          stopEditing();
                                        } else if (e.key === 'Escape') {
                                          cancelEditing();
                                        }
                                      }}
                                      className="date-input-editor"
                                      autoFocus
                                    />
                                  ) : isNBLCategoryColumn(headers[cellIndex]) ? (
                                    <select
                                      value={editingValue}
                                      onChange={async (e) => {
                                        const newValue = e.target.value;
                                        console.log('NBL Category dropdown changed to:', newValue);
                                        console.log('Current editing cell:', editingCell);
                                        console.log('Record IDs array:', recordIds);
                                        
                                        setEditingValue(newValue);
                                        
                                        // Immediately save the change
                                        if (editingCell) {
                                          const actualRowIndex = editingCell.actualRow;
                                          const recordId = recordIds[actualRowIndex];
                                          console.log('Updating record ID:', recordId, 'at row index:', actualRowIndex);
                                          
                                          if (!recordId) {
                                            console.error('No record ID found for row:', actualRowIndex);
                                            alert('Error: Cannot save - no record ID found');
                                            return;
                                          }
                                          
                                          const newData = [...excelData];
                                          if (newData[actualRowIndex]) {
                                            newData[actualRowIndex][editingCell.col] = newValue;
                                            setExcelData(newData);
                                            
                                            // Update backend
                                            try {
                                              const updatedRecord = {};
                                              headers.forEach((header, index) => {
                                                updatedRecord[header] = newData[actualRowIndex][index];
                                              });
                                              
                                              console.log('Sending update to backend:', updatedRecord);
                                              const response = await api.updateNBLRecord(recordId, updatedRecord);
                                              console.log('Backend response:', response);
                                              
                                              setLastSaved(new Date().toLocaleString());
                                              console.log('NBL Category updated successfully:', newValue);
                                            } catch (error) {
                                              console.error('Error updating NBL Category:', error);
                                              alert('Failed to save NBL Category change to server: ' + error.message);
                                            }
                                          }
                                        }
                                        
                                        // Close the editor after a short delay
                                        setTimeout(() => {
                                          setEditingCell(null);
                                          setEditingValue('');
                                        }, 150);
                                      }}
                                      onBlur={() => {
                                        setEditingCell(null);
                                        setEditingValue('');
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          cancelEditing();
                                        }
                                      }}
                                      className="nbl-category-dropdown"
                                      autoFocus
                                    >
                                      {nblCategoryOptions.map((option, idx) => (
                                        <option key={idx} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onBlur={stopEditing}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          stopEditing();
                                        } else if (e.key === 'Escape') {
                                          cancelEditing();
                                        }
                                      }}
                                      className="text-input-editor"
                                      autoFocus
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className={`cell-content ${isDateColumn(headers[cellIndex]) ? 'date-cell clickable' : ''} ${isNBLCategoryColumn(headers[cellIndex]) ? 'nbl-category-cell clickable' : ''}`}>
                                  <span className="cell-value">{row[cellIndex] || ''}</span>
                                  {isDateColumn(headers[cellIndex]) && (
                                    <span className="edit-indicator date-indicator">📅</span>
                                  )}
                                  {isNBLCategoryColumn(headers[cellIndex]) && (
                                    <span className="edit-indicator pencil-indicator">✏️</span>
                                  )}
                                </div>
                              )}
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
      )}
    </div>
  );
};

export default NBLList;
