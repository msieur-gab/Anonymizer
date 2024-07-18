let headers, rows;
let deferredPrompt;
let emptyColumnIndices = [];

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show your custom "Add to Home Screen" button here
  showInstallButton();
});

function showInstallButton() {
  const installButton = document.createElement('button');
  installButton.textContent = 'Install App';
  installButton.classList.add('install-button');
  document.body.appendChild(installButton);

  installButton.addEventListener('click', (e) => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
      });
    }
  });
}

document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const file = document.getElementById('csvFile').files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const { headers: parsedHeaders, rows: parsedRows, emptyColumnIndices: detectedEmptyColumns } = parseFile(e.target.result, file.name);
            headers = parsedHeaders;
            rows = parsedRows;
            emptyColumnIndices = detectedEmptyColumns;

            renderTable();
            analyzeAndRecommend();
            
            if (emptyColumnIndices.length > 0) {
                showEmptyColumnsOption();
            }
        } catch (error) {
            console.error('Error processing file:', error);
            // Display error message to user
        }
    };

    reader.readAsText(file);
});

// function parseCSV(data) {
//     rows = data.split('\n').map(row => row.split(','));
//     headers = rows.shift();
// }

function parseFile(data, fileName) {
    const delimiter = fileName.endsWith('.tsv') ? '\t' : ',';
    let rows = data.split('\n').map(row => row.split(delimiter));
    headers = rows.shift();
	// Hide the "Add API Column" button when a new file is loaded
document.getElementById('addApiColumnBtn').style.display = 'none';

    // Identify empty columns
    const emptyColumnIndices = headers.reduce((acc, header, index) => {
        if (header.trim() === '' && rows.every(row => !row[index] || row[index].trim() === '')) {
            acc.push(index);
        }
        return acc;
    }, []);

    return { headers, rows, emptyColumnIndices };
}

async function renderTable() {
	await enrichDataWithAPI();
    const table = document.getElementById('csvTable');
    table.innerHTML = '';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach((header, index) => {
        const th = document.createElement('th');
        const headerContent = document.createElement('div');
        headerContent.className = 'header-content';

        const icon = document.createElement('span');
        icon.className = 'header-icon';
        icon.innerHTML = getHeaderIcon(header);
        
        const headerText = document.createElement('span');
        headerText.textContent = header;
        
        headerContent.appendChild(icon);
        headerContent.appendChild(headerText);
        th.appendChild(headerContent);

        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        th.appendChild(resizer);

        headerRow.appendChild(th);
	    document.getElementById('addApiColumnBtn').style.display = 'block';
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach((cell, index) => {
            const td = document.createElement('td');
            if (isImageUrl(cell)) {
                const img = document.createElement('img');
                img.src = cell;
                img.alt = 'Image preview';
                img.className = 'image-preview';
                img.onerror = function() {
                    this.onerror = null;
                    this.src = 'path/to/fallback-image.png';
                    this.alt = 'Image load failed';
                };
                td.appendChild(img);
            } else {
                td.textContent = cell;
            }
            td.className = 'ellipsis';
            td.dataset.column = index;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    document.getElementById('tableContainer').style.display = 'block';
    
    calculateColumnWidths();
		setupColumnVisibility();
	  setupExportOptions();


    // Add event listeners for column resizing
    const resizers = table.querySelectorAll('.resizer');
    resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', initResize);
    });
	
}

function isImageUrl(url) {
    // This regex checks for image file extensions, ignoring case and allowing for query parameters
    const imageExtensionRegex = /\.(jpg|jpeg|png|webp|avif|gif|svg)([\?#].*)?$/i;
    try {
        const parsedUrl = new URL(url);
        return imageExtensionRegex.test(parsedUrl.pathname);
    } catch (e) {
        // If the URL is invalid, return false
        return false;
    }
}

function setupColumnVisibility() {
  const dropdown = document.getElementById('columnVisibilityDropdown');
  const toggleButton = dropdown.querySelector('.dropdown-toggle');
  const dropdownMenu = dropdown.querySelector('.dropdown-menu');
  const columnList = document.getElementById('columnList');
  const searchInput = document.getElementById('columnSearch');
  const hideAllButton = document.getElementById('hideAllColumns');
  const showAllButton = document.getElementById('showAllColumns');

  // Toggle dropdown
  toggleButton.addEventListener('click', () => {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
  });

  // Close dropdown when clicking outside
  window.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdownMenu.style.display = 'none';
    }
  });

  // Populate column list
  headers.forEach((header, index) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `toggle-col-${index}`;
    checkbox.checked = true;

    const label = document.createElement('label');
    label.htmlFor = `toggle-col-${index}`;
    label.textContent = header;

    const wrapper = document.createElement('div');
    wrapper.className = 'column-toggle';
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    columnList.appendChild(wrapper);

    checkbox.addEventListener('change', () => toggleColumnVisibility(index, checkbox.checked));
  });

  // Search functionality
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    columnList.querySelectorAll('.column-toggle').forEach(toggle => {
      const label = toggle.querySelector('label');
      toggle.style.display = label.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
    });
  });

  // Hide all columns
  hideAllButton.addEventListener('click', () => {
    columnList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
      toggleColumnVisibility(parseInt(checkbox.id.split('-')[2]), false);
    });
  });

  // Show all columns
  showAllButton.addEventListener('click', () => {
    columnList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = true;
      toggleColumnVisibility(parseInt(checkbox.id.split('-')[2]), true);
    });
  });
}

function toggleColumnVisibility(columnIndex, isVisible) {
  const table = document.getElementById('csvTable');
  const headers = table.querySelectorAll('th');
  const rows = table.querySelectorAll('tbody tr');

  headers[columnIndex].style.display = isVisible ? '' : 'none';
  rows.forEach(row => {
    row.cells[columnIndex].style.display = isVisible ? '' : 'none';
  });
}

function calculateColumnWidths() {
    const table = document.getElementById('csvTable');
    const headerCells = table.querySelectorAll('th');
    const bodyCells = table.querySelectorAll('td');

    headers.forEach((header, index) => {
        let maxWidth = header.length * 10; // Base width on header text
        bodyCells.forEach(cell => {
            if (cell.cellIndex === index) {
                maxWidth = Math.max(maxWidth, cell.textContent.length * 8);
            }
        });
        maxWidth = Math.min(Math.max(maxWidth, 100), 300); // Set min and max widths
        headerCells[index].style.width = `${maxWidth}px`;
        headerCells[index].style.minWidth = `${maxWidth}px`; // Add this line
        bodyCells.forEach(cell => {
            if (cell.cellIndex === index) {
                cell.style.width = `${maxWidth}px`;
                cell.style.minWidth = `${maxWidth}px`; // Add this line
            }
        });
    });
}

function initResize(e) {
    e.preventDefault();
    e.stopPropagation();
    const th = e.target.closest('th');
    const table = th.closest('table');
    const index = Array.from(th.parentElement.children).indexOf(th);
    const startX = e.pageX;
    const startWidth = th.offsetWidth;

    function handleResize(e) {
        const width = Math.max(startWidth + (e.pageX - startX), 50); // Minimum width
        th.style.width = `${width}px`;
        th.style.minWidth = `${width}px`; // Add this line
        Array.from(table.rows).forEach(row => {
            const cell = row.cells[index];
            cell.style.width = `${width}px`;
            cell.style.minWidth = `${width}px`; // Add this line
        });
    }

    function stopResize() {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
    }

    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', stopResize);
}

function getHeaderIcon(header) {
    const lowercaseHeader = header.toLowerCase();
    if (lowercaseHeader.includes('email')) {
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M20,8l-8,5L4,8V6l8,5l8-5V8z"/></svg>';
    } else if (lowercaseHeader.includes('phone')) {
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/></svg>';
    } else if (lowercaseHeader.includes('name')) {
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/></svg>';
    } else if (lowercaseHeader.includes('url') || lowercaseHeader.includes('link')) {
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"/></svg>';
    } else if (lowercaseHeader.includes('image') || lowercaseHeader.includes('img')) {
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z"/></svg>';
    } else {
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"/></svg>';
    }
}

function analyzeAndRecommend() {
    const patterns = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\+?[\d\s()-]{7,20}$/,
        name: /^[A-Z][a-z]+ [A-Z][a-z]+$/,
        ssn: /^\d{3}-\d{2}-\d{4}$/,
        creditCard: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/
    };

    const columnsToAnonymize = headers.map((header, index) => {
        const columnData = rows.map(row => row[index]);
        const matches = Object.values(patterns).some(pattern => 
            columnData.some(value => pattern.test(value))
        );
        return { header, index, matches };
    });

    renderColumnSelection(columnsToAnonymize);
}

function renderColumnSelection(columnsToAnonymize) {
    const columnSelection = document.getElementById('columnSelection');
    columnSelection.innerHTML = '<h4>Select columns to anonymize:</h4>';

    columnsToAnonymize.forEach(({ header, index, matches }) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col-${index}`;
        checkbox.dataset.column = index;
        checkbox.checked = matches;  // Pre-select recommended columns

        const label = document.createElement('label');
        label.htmlFor = `col-${index}`;
        label.textContent = header;

        if (matches) {
            label.style.fontWeight = 'bold';
            label.style.color = '#e74c3c';
        }

        const wrapper = document.createElement('div');
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        
        if (matches) {
            const recommendedSpan = document.createElement('span');
            recommendedSpan.textContent = ' (Recommended)';
            recommendedSpan.style.color = '#e74c3c';
            wrapper.appendChild(recommendedSpan);
        }

        columnSelection.appendChild(wrapper);

        checkbox.addEventListener('change', () => updateAnonymization());
    });

    // Initial anonymization based on recommendations
    updateAnonymization();
}

function showEmptyColumnsOption() {
    const optionContainer = document.getElementById('emptyColumnsOptionContainer');
    optionContainer.style.display = 'block';
    optionContainer.innerHTML = `
        <div>
            <input type="checkbox" id="removeEmptyColumns">
            <label for="removeEmptyColumns">Remove ${emptyColumnIndices.length} empty column(s)</label>
        </div>
        <button id="applyEmptyColumnsRemoval">Apply</button>
    `;

    document.getElementById('applyEmptyColumnsRemoval').addEventListener('click', removeEmptyColumns);
}

function removeEmptyColumns() {
    if (document.getElementById('removeEmptyColumns').checked) {
        headers = headers.filter((_, index) => !emptyColumnIndices.includes(index));
        rows = rows.map(row => row.filter((_, index) => !emptyColumnIndices.includes(index)));
        
        renderTable();
        analyzeAndRecommend();
        
        // Hide the option after applying
        document.getElementById('emptyColumnsOptionContainer').style.display = 'none';
    }
}

function updateAnonymization() {
    const selectedColumns = Array.from(document.querySelectorAll('#columnSelection input:checked'))
        .map(input => parseInt(input.dataset.column));

    const tableBody = document.querySelector('#csvTable tbody');
    tableBody.querySelectorAll('tr').forEach((tr, rowIndex) => {
        tr.querySelectorAll('td').forEach(td => {
            const columnIndex = parseInt(td.dataset.column);
            if (selectedColumns.includes(columnIndex)) {
                const cellContent = td.querySelector('img') ? td.querySelector('img').src : td.textContent;
                const anonymizedValue = anonymizeValue(cellContent, headers[columnIndex]);
                if (td.querySelector('img')) {
                    td.querySelector('img').src = anonymizedValue;
                } else {
                    td.textContent = anonymizedValue;
                }
                td.classList.add('anonymized');
            } else {
                if (td.querySelector('img')) {
                    td.querySelector('img').src = rows[tr.rowIndex - 1][columnIndex];
                } else {
                    td.textContent = rows[tr.rowIndex - 1][columnIndex];
                }
                td.classList.remove('anonymized');
            }
        });
    });
}

function anonymizeValue(value, type) {
    if (isImageUrl(value) || type.toLowerCase().includes('image') || type.toLowerCase().includes('url')) {
        return value; // Don't anonymize images or URLs
    } else if (type.toLowerCase().includes('email')) {
        return 'user' + Math.random().toString(36).substr(2, 5) + '@example.com';
    } else if (type.toLowerCase().includes('phone')) {
        return '+X-XXX-XXX-' + Math.floor(1000 + Math.random() * 9000);
    } else if (type.toLowerCase().includes('name')) {
        return 'Anonymous User';
    } else if (type.toLowerCase().includes('ssn')) {
        return 'XXX-XX-' + Math.floor(1000 + Math.random() * 9000);
    } else if (type.toLowerCase().includes('credit')) {
        return 'XXXX-XXXX-XXXX-' + Math.floor(1000 + Math.random() * 9000);
    } else {
        return 'ANONYMIZED';
    }
}

function setupExportOptions() {
  const dropdown = document.getElementById('exportDropdown');
  const toggleButton = dropdown.querySelector('.dropdown-toggle');
  const dropdownMenu = dropdown.querySelector('.dropdown-menu');
	
	// const exportNote = document.createElement('p');
	// exportNote.textContent = 'Note: Exports include all columns, including hidden ones.';
	// exportNote.style.fontSize = '0.8em';
	// exportNote.style.color = '#666';
	// dropdown.appendChild(exportNote);

  toggleButton.addEventListener('click', () => {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
  });

  window.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdownMenu.style.display = 'none';
    }
  });

  document.getElementById('exportCSV').addEventListener('click', exportCSV);
  document.getElementById('exportJSON').addEventListener('click', exportJSON);
  document.getElementById('exportXLSX').addEventListener('click', exportXLSX);
}

function getExportData() {
  const anonymizedColumns = Array.from(document.querySelectorAll('#columnSelection input:checked'))
    .map(input => parseInt(input.dataset.column));

  const exportRows = rows.map(row => 
    row.map((cell, index) => 
      anonymizedColumns.includes(index) 
        ? anonymizeValue(cell, headers[index]) 
        : cell
    )
  );

  return [headers, ...exportRows];
}

function exportCSV() {
  const data = getExportData();
  const csvContent = data.map(row => row.join(',')).join('\n');
  downloadFile(csvContent, 'export.csv', 'text/csv;charset=utf-8;');
}

function exportJSON() {
  const data = getExportData();
  const [exportHeaders, ...exportRows] = data;
  const jsonData = exportRows.map(row => {
    return exportHeaders.reduce((obj, header, index) => {
      obj[header] = row[index];
      return obj;
    }, {});
  });
  const jsonContent = JSON.stringify(jsonData, null, 2);
  downloadFile(jsonContent, 'export.json', 'application/json');
}

function exportXLSX() {
  const data = getExportData();
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, 'export.xlsx');
}



function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}



// document.getElementById('downloadButton').addEventListener('click', function() {
//     const selectedColumns = Array.from(document.querySelectorAll('#columnSelection input:checked'))
//         .map(input => parseInt(input.dataset.column));

//     const anonymizedRows = rows.map(row =>
//         row.map((cell, index) => selectedColumns.includes(index) ? anonymizeValue(cell, headers[index]) : cell)
//     );

//     const csvContent = [headers, ...anonymizedRows].map(row => row.join(',')).join('\n');
    
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', 'anonymized_data.csv');
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
// });
