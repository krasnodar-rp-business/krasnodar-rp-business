// Функции пользовательского интерфейса
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

function loadBusinesses(filterLevel = 'all', filterStatus = 'all') {
    const grid = document.getElementById('businessGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (businesses.length === 0) {
        grid.innerHTML = '<div class="loading">Нет данных о бизнесах</div>';
        return;
    }
    
    const filteredBusinesses = businesses.filter(business => {
        const levelMatch = filterLevel === 'all' || business.level === filterLevel;
        const statusMatch = filterStatus === 'all' || business.status === filterStatus;
        return levelMatch && statusMatch;
    });
    
    filteredBusinesses.forEach(business => {
        const businessCard = document.createElement('div');
        businessCard.className = 'business-card';
        businessCard.innerHTML = `
            <div class="business-header">
                <span class="business-id">M0-${business.level} | #${business.businessNumber}</span>
                <span class="business-status ${business.status === 'sold' ? 'status-sold' : ''}">
                    ${business.status === 'sold' ? 'Продано' : 'На продаже'}
                </span>
            </div>
            <h3 class="business-name">${business.name}</h3>
            <p class="business-fullname">${business.fullName}</p>
            <p class="business-description">${business.description}</p>
            <div class="business-details">
                <div class="detail-item">
                    <span>Цена:</span>
                    <span>${business.price}</span>
                </div>
                <div class="detail-item">
                    <span>Доход в неделю:</span>
                    <span>${business.weeklyIncome}</span>
                </div>
                <div class="detail-item">
                    <span>Владелец:</span>
                    <span>${business.owner === 'Отсутствует' || business.owner === 'отсутствует' ? 'Свободен' : 'ID: ' + business.owner}</span>
                </div>
                ${business.note ? `<div class="detail-item">
                    <span>📌 Примечание:</span>
                    <span>${business.note}</span>
                </div>` : ''}
            </div>
            <div class="business-meta">
                <div class="business-price">${business.price}</div>
                <button class="buy-btn" onclick="openBuyModal(${business.id})" ${business.status === 'sold' ? 'disabled' : ''}>
                    ${business.status === 'sold' ? 'Продано' : 'Купить'}
                </button>
            </div>
        `;
        grid.appendChild(businessCard);
    });

    updateStats();
}

function updateStats() {
    const totalAvailable = businesses.filter(b => b.status === 'available').length;
    const totalSold = businesses.filter(b => b.status === 'sold').length;
    
    const totalBusinessesEl = document.getElementById('totalBusinesses');
    const soldBusinessesEl = document.getElementById('soldBusinesses');
    
    if (totalBusinessesEl) totalBusinessesEl.textContent = totalAvailable;
    if (soldBusinessesEl) soldBusinessesEl.textContent = totalSold;
}

function updateUI() {
    loadBusinesses();
    updateStats();
    
    if (document.getElementById('adminContent').style.display !== 'none') {
        loadApplications();
        loadBusinessManagement();
    }
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.parentElement;
            if (!parent) return;
            
            const filterType = parent.querySelector('span')?.textContent;
            const filterValue = this.dataset.level || this.dataset.status;
            
            parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (filterType === 'Уровень:') {
                const statusFilter = document.querySelector('[data-status].active')?.dataset.status || 'all';
                loadBusinesses(filterValue, statusFilter);
            } else {
                const levelFilter = document.querySelector('[data-level].active')?.dataset.level || 'all';
                loadBusinesses(levelFilter, filterValue);
            }
        });
    });
}

function openBuyModal(businessId) {
    const business = businesses.find(b => b.id === businessId);
    const modal = document.getElementById('buyModal');
    const businessIdInput = document.getElementById('businessId');
    
    if (!business || !modal || !businessIdInput) return;
    
    businessIdInput.value = businessId;
    modal.style.display = 'block';
    
    const modalTitle = modal.querySelector('h3');
    if (modalTitle) {
        modalTitle.textContent = `Покупка: ${business.name}`;
    }
}

function setupModal() {
    const modal = document.getElementById('buyModal');
    const closeBtn = modal?.querySelector('.close');
    
    if (!closeBtn) return;
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
        resetModal();
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            resetModal();
        }
    }
}

function resetModal() {
    const form = document.getElementById('buyForm');
    const modalForm = document.getElementById('modalForm');
    if (!form || !modalForm) return;
    
    form.style.display = 'block';
    form.reset();
    
    const successMsg = modalForm.querySelector('.success-message');
    if (successMsg) {
        successMsg.remove();
    }
}

function setupForm() {
    const form = document.getElementById('buyForm');
    if (!form) return;
    
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const businessId = document.getElementById('businessId')?.value;
        const discordId = document.getElementById('discordId')?.value;
        const contact = document.getElementById('contact')?.value;
        
        if (!businessId || !discordId || !contact) {
            alert('Заполните все поля!');
            return;
        }
        
        const business = businesses.find(b => b.id === parseInt(businessId));
        if (!business) {
            alert('Бизнес не найден!');
            return;
        }
        
        if (business.status === 'sold') {
            alert('Этот бизнес уже продан!');
            return;
        }
        
        const applicationData = {
            id: generateApplicationId(),
            business: business.name,
            price: business.price,
            discordId: discordId,
            contact: contact,
            timestamp: new Date().toLocaleString('ru-RU'),
            status: 'pending'
        };

        applications.push(applicationData);
        
        const saveSuccess = await saveDataWithSync();
        
        if (saveSuccess) {
            console.log('✅ Заявка сохранена');
            showApplicationSuccess(applicationData);
        } else {
            alert('❌ Ошибка сохранения заявки. Попробуйте еще раз.');
        }
    };
}

function generateApplicationId() {
    return 'APP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function showApplicationSuccess(appData) {
    const form = document.getElementById('buyForm');
    const modalForm = document.getElementById('modalForm');
    
    if (!form || !modalForm) return;
    
    form.style.display = 'none';
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <h3>✅ Заявка создана!</h3>
        
        <div class="app-id-display">
            <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 0.5rem;">Номер заявки:</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: #00d26a; margin: 0.5rem 0;">${appData.id}</div>
        </div>
        
        <div class="app-details">
            <div><strong>Бизнес:</strong> ${appData.business}</div>
            <div><strong>Сумма:</strong> ${appData.price}</div>
        </div>
        
        <div class="instructions">
            <h4 style="color: #667eea; margin-bottom: 1rem;">📝 Инструкция по оплате:</h4>
            <ol>
                <li>Оплати <strong>${appData.price}</strong> через UnbelievaBoat</li>
                <li>Напиши администратору в Discord номер заявки: <strong>${appData.id}</strong></li>
                <li>Жди подтверждения и получения роли</li>
            </ol>
        </div>
        
        <button onclick="closeModalAndReset()" class="btn-primary">Понятно</button>
    `;
    
    modalForm.appendChild(successDiv);
}

function closeModalAndReset() {
    const modal = document.getElementById('buyModal');
    if (modal) {
        modal.style.display = 'none';
    }
    resetModal();
}
