// Функции синхронизации данных
async function syncData() {
    try {
        showSyncStatus('🔄 Синхронизация...', 'sync');
        
        const localData = loadFromLocalStorage();
        const remoteData = await loadFromGist();
        
        let finalData;
        
        if (!localData && !remoteData) {
            console.log('⚠️ Данных нет нигде, инициализируем...');
            await initializeDefaultData();
            return;
        }
        
        if (!localData) {
            console.log('✅ Загружаем данные из Gist (локальных нет)');
            finalData = remoteData;
        } else if (!remoteData) {
            console.log('✅ Используем локальные данные (удаленных нет)');
            finalData = localData;
        } else {
            const localTime = new Date(localData.lastUpdated || 0);
            const remoteTime = new Date(remoteData.lastUpdated || 0);
            
            if (remoteTime > localTime) {
                console.log('✅ Данные из Gist новее, используем их');
                finalData = remoteData;
            } else {
                console.log('✅ Локальные данные новее, используем их');
                finalData = localData;
            }
        }
        
        businesses = finalData.businesses || [];
        applications = finalData.applications || [];
        lastSyncTime = finalData.lastUpdated;
        
        await saveDataEverywhere(finalData);
        updateUI();
        
        showSyncStatus('✅ Синхронизировано', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка синхронизации:', error);
        showSyncStatus('❌ Ошибка синхронизации', 'error');
        
        const localData = loadFromLocalStorage();
        if (localData) {
            businesses = localData.businesses || [];
            applications = localData.applications || [];
            updateUI();
            console.log('⚠️ Используем локальные данные из-за ошибки синхронизации');
        }
    }
}

async function saveDataWithSync() {
    try {
        showSyncStatus('🔄 Сохранение...', 'sync');
        
        const dataToSave = {
            businesses: businesses,
            applications: applications,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
        
        await saveDataEverywhere(dataToSave);
        lastSyncTime = dataToSave.lastUpdated;
        
        showSyncStatus('✅ Данные сохранены', 'success');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showSyncStatus('❌ Ошибка сохранения', 'error');
        return false;
    }
}

async function saveDataEverywhere(data) {
    saveToLocalStorage(data);
    await saveToGist(data);
}

// LocalStorage функции
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('krasnodar_business_data');
        if (savedData) {
            return JSON.parse(savedData);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки из localStorage:', error);
    }
    return null;
}

function saveToLocalStorage(data) {
    try {
        localStorage.setItem('krasnodar_business_data', JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения в localStorage:', error);
        return false;
    }
}

// Gist функции
async function loadFromGist() {
    try {
        const response = await fetch(`https://api.github.com/gists/${CONFIG.GIST_CONFIG.GIST_ID}?t=${Date.now()}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('⚠️ Gist не найден, будет создан при первом сохранении');
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const gistData = await response.json();
        const fileContent = gistData.files[CONFIG.GIST_CONFIG.FILENAME].content;
        return JSON.parse(fileContent);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки из Gist:', error);
        return null;
    }
}

async function saveToGist(data) {
    try {
        let sha = null;
        try {
            const fileResponse = await fetch(`https://api.github.com/gists/${CONFIG.GIST_CONFIG.GIST_ID}`);
            if (fileResponse.ok) {
                const fileData = await fileResponse.json();
                sha = fileData.files[CONFIG.GIST_CONFIG.FILENAME].sha;
            }
        } catch (e) {
            console.log('ℹ️ Gist не существует, будет создан новый');
        }
        
        const response = await fetch(
            `https://api.github.com/gists/${CONFIG.GIST_CONFIG.GIST_ID}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${CONFIG.GIST_CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: `Krasnodar RP Business Data - Updated ${new Date().toLocaleString()}`,
                    files: {
                        [CONFIG.GIST_CONFIG.FILENAME]: {
                            content: JSON.stringify(data, null, 2),
                            sha: sha
                        }
                    }
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка сохранения в Gist');
        }
        
        console.log('✅ Данные сохранены в Gist');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения в Gist:', error);
        throw error;
    }
}

async function initializeDefaultData() {
    businesses = DEFAULT_BUSINESSES;
    applications = [];
    
    const dataToSave = {
        businesses: businesses,
        applications: applications,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
    };
    
    await saveDataEverywhere(dataToSave);
    updateUI();
    
    console.log('✅ Начальные данные инициализированы');
}
