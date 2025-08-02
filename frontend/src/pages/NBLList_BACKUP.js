import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import '../styles/nbl-list.css';

const NBLList = () => {
  const [excelData, setExcelData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
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
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      // Don't show alert for this error as it might be expected (no data exists yet)
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing data on component mount
  useEffect(() => {
    loadExistingData();
  }, []);

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
          
          setHeaders(headerRow);
          setExcelData(dataRows);
          setFileName(file.name);
          
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
          
          setCurrentPage(1);
          setSearchTerm('');
          setSortConfig({ column: null, direction: null });
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

  return (
    <div className="nbl-list-container">
      <div className="page-header">
        <div className="tab-header">
          <h1>NBL List</h1>
        </div>
        <p>Upload Excel file to view and manage NBL data</p>
      </div>

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

      {excelData.length > 0 && (
        <div className="data-section">
          <div className="search-section">
            <div className="control-group">
              <label>Search:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search in all columns..."
                className="search-input"
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    visibleColumns[index] && (
                      <th 
                        key={index}
                        style={{
                          border: '1px solid #ccc',
                          padding: '8px',
                          background: '#f5f5f5',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSort(index)}
                      >
                        <div>
                          <span>{header}</span>
                          {sortConfig.column === index && (
                            <span style={{ marginLeft: '5px' }}>
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder={`Filter ${header}...`}
                          value={columnFilters[index] || ''}
                          onChange={(e) => handleColumnFilter(index, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            marginTop: '4px',
                            padding: '2px',
                            fontSize: '11px'
                          }}
                        />
                      </th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header, cellIndex) => (
                      visibleColumns[cellIndex] && (
                        <td 
                          key={cellIndex}
                          style={{
                            border: '1px solid #ccc',
                            padding: '6px',
                            verticalAlign: 'top'
                          }}
                        >
                          {row[cellIndex] || ''}
                        </td>
                      )
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination-controls" style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ marginRight: '10px' }}
              >
                Previous
              </button>
              <span style={{ margin: '0 10px' }}>
                Page {currentPage} of {totalPages} ({filteredAndSortedData.length} records)
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ marginLeft: '10px' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NBLList;
