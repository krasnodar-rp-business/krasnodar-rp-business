// Основная инициализация приложения
async function initializeApp() {
    console.log('🚀 Инициализация приложения...');
    
    await syncData();
    
    setupFilters();
    setupModal();
    setupForm();
    
    setInterval(syncData, CONFIG.SYNC_INTERVAL);
    
    console.log('✅ Приложение инициализировано');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    initializeApp();
    
    // Плавная прокрутка для якорных ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    console.log('Initialization complete');
});

// Глобальные функции
window.loginToAdmin = loginToAdmin;
window.logoutAdmin = logoutAdmin;
window.openBuyModal = openBuyModal;
window.completeApplication = completeApplication;
window.deleteApplication = deleteApplication;
window.freeBusiness = freeBusiness;
window.markAsSold = markAsSold;
window.closeModalAndReset = closeModalAndReset;
