// api-management.js

let apiConfigurations = [];

document.getElementById('addApiColumnBtn').addEventListener('click', showApiConfigModal);
document.getElementById('apiConfigForm').addEventListener('submit', handleApiConfigSubmit);
document.getElementById('cancelApiConfig').addEventListener('click', hideApiConfigModal);

function showApiConfigModal() {
    document.getElementById('apiConfigModal').style.display = 'block';
    updateParameterFields();
}

function hideApiConfigModal() {
    document.getElementById('apiConfigModal').style.display = 'none';
}

function updateParameterFields() {
    const parameterFields = document.getElementById('parameterFields');
    parameterFields.innerHTML = '';
    headers.forEach((header, index) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `param-${index}`;
        checkbox.name = 'apiParameters';
        checkbox.value = index;

        const label = document.createElement('label');
        label.htmlFor = `param-${index}`;
        label.textContent = header;

        parameterFields.appendChild(checkbox);
        parameterFields.appendChild(label);
    });
}

function handleApiConfigSubmit(e) {
    e.preventDefault();
    const apiConfig = {
        name: document.getElementById('apiName').value,
        url: document.getElementById('apiUrl').value,
        key: document.getElementById('apiKey').value,
        host: document.getElementById('apiHost').value,
        method: document.getElementById('apiMethod').value,
        parameters: Array.from(document.querySelectorAll('input[name="apiParameters"]:checked')).map(input => parseInt(input.value)),
        resultKey: document.getElementById('apiResultKey').value
    };
    apiConfigurations.push(apiConfig);
    console.log('API configuration added:', apiConfig);
    addAPIColumn(apiConfig);
    hideApiConfigModal();
    this.reset();
}

async function addAPIColumn(apiConfig) {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = 'block';

    headers.push(apiConfig.name);
    rows.forEach(row => row.push('')); // Add empty cell for each row

    try {
        await renderTable();
        await analyzeAndRecommend();
        updateColumnSelectionUI();
        setupColumnVisibility(); // Ajoutez cette ligne
        setupExportOptions(); // Ajoutez cette ligne
    } catch (error) {
        console.error('Error adding API column:', error);
    } finally {
        loadingMessage.style.display = 'none';
    }
}

async function enrichDataWithAPI() {
    for (const apiConfig of apiConfigurations) {
        for (let i = 0; i < rows.length; i++) {
            try {
                let url = new URL(apiConfig.url); // Assurez-vous que c'est une URL valide
                if (apiConfig.method === 'GET') {
                    // Utilisez seulement la valeur de la cellule, pas le titre de la colonne
                    const cellValue = rows[i][apiConfig.parameters[0]]; // Supposons que nous n'utilisons que le premier paramètre sélectionné
                    url.searchParams.append('text', cellValue);
                }
                const result = await callAPI(url.toString(), apiConfig.key, apiConfig.host, apiConfig.method);
                rows[i][headers.indexOf(apiConfig.name)] = apiConfig.resultKey ? result[apiConfig.resultKey] : JSON.stringify(result);
            } catch (error) {
                console.error(`Error enriching data for row ${i} with API ${apiConfig.name}:`, error);
                rows[i][headers.indexOf(apiConfig.name)] = 'Error';
            }
        }
    }
}

async function callAPI(url, apiKey, apiHost, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': apiHost
        }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}
