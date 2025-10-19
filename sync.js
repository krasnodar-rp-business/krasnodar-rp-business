// Функции для работы с данными
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

function saveToLocalStorage() {
    try {
        const dataToSave = {
            businesses: businesses,
            applications: applications,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('krasnodar_business_data', JSON.stringify(dataToSave));
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения в localStorage:', error);
        return false;
    }
}

function initializeDefaultData() {
    businesses = DEFAULT_BUSINESSES;
    applications = [];
    saveToLocalStorage();
    updateUI();
    console.log('✅ Начальные данные инициализированы');
}

function showSyncStatus(message, type) {
    const syncStatus = document.getElementById('syncStatus');
    const syncMessage = document.getElementById('syncMessage');
    
    if (!syncStatus || !syncMessage) return;
    
    syncMessage.textContent = message;
    syncStatus.className = `sync-status ${type === 'success' ? 'sync-success' : type === 'error' ? 'sync-error' : ''}`;
    syncStatus.style.display = 'block';
    
    setTimeout(() => {
        syncStatus.style.display = 'none';
    }, 3000);
}

async function syncData() {
    try {
        showSyncStatus('🔄 Синхронизация...', 'sync');
        
        const localData = loadFromLocalStorage();
        
        if (!localData) {
            console.log('⚠️ Локальных данных нет, инициализируем...');
            await initializeDefaultData();
            return;
        }
        
        businesses = localData.businesses || [];
        applications = localData.applications || [];
        
        updateUI();
        
        showSyncStatus('✅ Данные загружены', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка синхронизации:', error);
        showSyncStatus('❌ Ошибка загрузки', 'error');
        
        const localData = loadFromLocalStorage();
        if (localData) {
            businesses = localData.businesses || [];
            applications = localData.applications || [];
            updateUI();
            console.log('⚠️ Используем локальные данные из-за ошибки синхронизации');
        }
    }
}

async function saveData() {
    try {
        showSyncStatus('🔄 Сохранение...', 'sync');
        
        const success = saveToLocalStorage();
        
        if (success) {
            showSyncStatus('✅ Данные сохранены', 'success');
            return true;
        } else {
            throw new Error('Ошибка сохранения');
        }
        
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showSyncStatus('❌ Ошибка сохранения', 'error');
        return false;
    }
}
