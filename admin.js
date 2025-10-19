// Функции админ-панели
function loginToAdmin() {
    const passwordInput = document.getElementById('adminPassword');
    if (!passwordInput) return;
    
    const password = passwordInput.value;
    if (password === CONFIG.ADMIN_PASSWORD) {
        document.getElementById('adminLoginForm').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadApplications();
        loadBusinessManagement();
        startAutoRefresh();
    } else {
        alert('Неверный пароль!');
    }
}

function logoutAdmin() {
    document.getElementById('adminLoginForm').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    stopAutoRefresh();
}

let refreshInterval;
function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        syncData();
    }, 5000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

function loadApplications() {
    const applicationsList = document.getElementById('applicationsList');
    if (!applicationsList) return;
    
    applicationsList.innerHTML = '';
    
    if (applications.length === 0) {
        applicationsList.innerHTML = '<p>Нет активных заявок</p>';
        return;
    }
    
    const sortedApplications = applications.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    sortedApplications.forEach((app) => {
        const appItem = document.createElement('div');
        appItem.className = 'application-item';
        appItem.innerHTML = `
            <div class="application-header">
                <span class="application-id">${app.id}</span>
                <span class="application-status ${app.status === 'completed' ? 'status-completed' : 'status-pending'}">
                    ${app.status === 'completed' ? 'Завершено' : 'В обработке'}
                </span>
            </div>
            <div><strong>Бизнес:</strong> ${app.business}</div>
            <div><strong>Discord:</strong> ${app.discordId}</div>
            <div><strong>Контакт:</strong> ${app.contact}</div>
            <div><strong>Время:</strong> ${app.timestamp}</div>
            ${app.status !== 'completed' ? `
            <div class="admin-actions">
                <button class="admin-btn btn-complete" onclick="completeApplication('${app.id}')">
                    Подтвердить покупку
                </button>
                <button class="admin-btn btn-delete" onclick="deleteApplication('${app.id}')">
                    Удалить
                </button>
            </div>
            ` : ''}
        `;
        applicationsList.appendChild(appItem);
    });
}

function loadBusinessManagement() {
    const businessList = document.getElementById('businessList');
    if (!businessList) return;
    
    businessList.innerHTML = '';
    
    businesses.forEach((business) => {
        const businessItem = document.createElement('div');
        businessItem.className = 'business-item';
        businessItem.innerHTML = `
            <div class="business-info">
                <strong>${business.name}</strong> (M0-${business.level}) - 
                <span style="color: ${business.status === 'available' ? '#00d26a' : '#ff4757'}">
                    ${business.status === 'available' ? 'Свободен' : 'Продано'}
                </span>
                ${business.status === 'sold' ? ` - Владелец: ${business.owner}` : ''}
            </div>
            <div class="business-actions">
                ${business.status === 'sold' ? 
                    `<button class="admin-btn btn-free" onclick="freeBusiness(${business.id})">
                        Освободить
                    </button>` : 
                    `<button class="admin-btn btn-complete" onclick="markAsSold(${business.id})">
                        Отметить проданным
                    </button>`
                }
            </div>
        `;
        businessList.appendChild(businessItem);
    });
}

async function freeBusiness(businessId) {
    const business = businesses.find(b => b.id === businessId);
    if (!business) return;
    
    if (confirm(`Вы уверены, что хотите освободить бизнес "${business.name}"?`)) {
        business.status = 'available';
        business.owner = 'Отсутствует';
        
        await saveDataWithSync();
        loadBusinesses();
        loadBusinessManagement();
        updateStats();
        
        alert(`✅ Бизнес "${business.name}" теперь свободен для покупки`);
    }
}

async function markAsSold(businessId) {
    const business = businesses.find(b => b.id === businessId);
    if (!business) return;
    
    const newOwner = prompt(`Введите Discord ID нового владельца для бизнеса "${business.name}":`);
    if (newOwner) {
        business.status = 'sold';
        business.owner = newOwner;
        
        await saveDataWithSync();
        loadBusinesses();
        loadBusinessManagement();
        updateStats();
        
        alert(`✅ Бизнес "${business.name}" отмечен как проданный владельцу ${newOwner}`);
    }
}

async function completeApplication(appId) {
    const appIndex = applications.findIndex(app => app.id === appId);
    
    if (appIndex === -1) return;
    
    const application = applications[appIndex];
    
    const business = businesses.find(b => b.name === application.business);
    if (business) {
        business.status = 'sold';
        business.owner = application.discordId;
    }
    
    applications[appIndex].status = 'completed';
    
    await saveDataWithSync();
    
    loadBusinesses();
    loadBusinessManagement();
    updateStats();
    loadApplications();
    
    alert(`✅ Покупка подтверждена! Бизнес "${application.business}" теперь принадлежит ${application.discordId}`);
}

async function deleteApplication(appId) {
    if (confirm('Вы уверены, что хотите удалить эту заявку?')) {
        applications = applications.filter(app => app.id !== appId);
        
        await saveDataWithSync();
        loadApplications();
    }
}
