// GlobeINT Billing System v1.06
// Payment Status Check + Copy UPI + 120s Timeout

const API_URL = 'https://script.google.com/macros/s/AKfycbyZH0rxfUMSZa8BtmOq3Ey96KnTXTZr9mcUl2_BSSBxOR4-msR92p4Sf3KPs4xFJFzHmQ/exec';
const WHATSAPP_NUMBER = '918879706046';

let currentUser = null;
let currentBillType = 'mobile';
let allBills = { mobile: [], electric: [], wifi: [] };
let userCredentials = null;
let loadingInterval = null;
let loadingMessageIndex = 0;
let currentPaymentBill = null;
let selectedService = null;
let paymentTimer = null;
let paymentTimeLeft = 120; // 120 seconds (2 minutes)
let statusCheckInterval = null;
let statusCheckMessageIndex = 0;

// Loading Messages
const loadingMessages = [
    "Preparing things for you...",
    "Getting everything in place...",
    "Just a moment...",
    "Setting things up...",
    "Almost there...",
    "Making it ready...",
    "Loading the good stuff...",
    "Tidying up in the background...",
    "Final touches...",
    "Done in a blink..."
];

// Payment Status Check Messages
const statusCheckMessages = [
    "Checking your payment...",
    "Verifying transaction...",
    "Confirming payment status...",
    "Hold on, matching details...",
    "Processing your request...",
    "Securely checking payment...",
    "Reviewing transaction info...",
    "Almost done, stay with us...",
    "Final confirmation in progress...",
    "Updating your payment status..."
];

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const statusCheckOverlay = document.getElementById('statusCheckOverlay');
const statusCheckText = document.getElementById('statusCheckText');
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const userSection = document.getElementById('userSection');
const userIdDisplay = document.getElementById('userIdDisplay');

const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');

const billTabs = document.querySelectorAll('.bill-tab-compact');
const billsContainer = document.getElementById('billsContainer');
const refreshBtn = document.getElementById('refreshBtn');
const sectionTitle = document.getElementById('sectionTitle');
const payAllBtn = document.getElementById('payAllBtn');

const mobileCount = document.getElementById('mobileCount');
const electricCount = document.getElementById('electricCount');
const wifiCount = document.getElementById('wifiCount');
const totalPendingBills = document.getElementById('totalPendingBills');
const totalPendingAmount = document.getElementById('totalPendingAmount');

const newConnectionBtn = document.getElementById('newConnectionBtn');
const userProfileBtn = document.getElementById('userProfileBtn');
const userProfileModal = document.getElementById('userProfileModal');
const closeProfileModal = document.getElementById('closeProfileModal');

const newConnectionModal = document.getElementById('newConnectionModal');
const closeNewConnectionModal = document.getElementById('closeNewConnectionModal');
const contactExpertBtn = document.getElementById('contactExpertBtn');

const paymentModal = document.getElementById('paymentModal');
const closePaymentModal = document.getElementById('closePaymentModal');
const checkPaymentBtn = document.getElementById('checkPaymentBtn');
const paymentTimerDisplay = document.getElementById('paymentTimer');
const copyUpiBtn = document.getElementById('copyUpiBtn');
const upiIdText = document.getElementById('upiIdText');

const phonePeBtn = document.getElementById('phonePeBtn');
const gPayBtn = document.getElementById('gPayBtn');
const paytmBtn = document.getElementById('paytmBtn');
const whatsappPayBtn = document.getElementById('whatsappPayBtn');

const paymentSuccessModal = document.getElementById('paymentSuccessModal');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const doneSuccessBtn = document.getElementById('doneSuccessBtn');

const paymentFailedModal = document.getElementById('paymentFailedModal');
const closeFailedModal = document.getElementById('closeFailedModal');
const retryPaymentBtn = document.getElementById('retryPaymentBtn');
const closeFailedBtn = document.getElementById('closeFailedBtn');

const paymentTimeoutModal = document.getElementById('paymentTimeoutModal');
const closeTimeoutModal = document.getElementById('closeTimeoutModal');
const generateNewQRBtn = document.getElementById('generateNewQRBtn');
const closeTimeoutBtn = document.getElementById('closeTimeoutBtn');

const logoutBtn = document.getElementById('logoutBtn');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🌐 GlobeINT v1.06 - Professional', 'color: #d40000; font-size: 16px; font-weight: bold;');
    feather.replace();
    checkSession();
    setupEventListeners();
    disableCopyPaste();
});

// Disable Copy/Paste/Right Click
function disableCopyPaste() {
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showToast('Right-click is disabled', 'error');
    });

    document.addEventListener('copy', (e) => {
        if (!e.target.matches('input, textarea')) {
            e.preventDefault();
            showToast('Copying is disabled', 'error');
        }
    });

    document.addEventListener('cut', (e) => {
        if (!e.target.matches('input, textarea')) {
            e.preventDefault();
            showToast('Cutting is disabled', 'error');
        }
    });

    document.addEventListener('paste', (e) => {
        if (!e.target.matches('input, textarea')) {
            e.preventDefault();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            showToast('Source viewing is disabled', 'error');
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            showToast('Developer tools are disabled', 'error');
        }
        if (e.key === 'F12') {
            e.preventDefault();
            showToast('Developer tools are disabled', 'error');
        }
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            showToast('Saving is disabled', 'error');
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
        }
    });

    console.log('🔒 Copy/Paste protection enabled');
}

// Event Listeners
function setupEventListeners() {
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    billTabs.forEach(tab => {
        if (!tab.disabled) {
            tab.addEventListener('click', () => switchBillType(tab.dataset.type));
        }
    });

    refreshBtn.addEventListener('click', () => {
        const icon = refreshBtn.querySelector('svg');
        icon.style.animation = 'spin 0.6s ease';
        setTimeout(() => icon.style.animation = '', 600);
        loadAllBills();
    });
    
    payAllBtn.addEventListener('click', handlePayAll);
    newConnectionBtn.addEventListener('click', openNewConnectionModal);
    logoutBtn.addEventListener('click', handleLogout);
    
    userProfileBtn.addEventListener('click', openUserProfile);
    closeProfileModal.addEventListener('click', closeUserProfile);
    
    closeNewConnectionModal.addEventListener('click', closeNewConnection);
    contactExpertBtn.addEventListener('click', contactExpert);
    
    document.addEventListener('click', (e) => {
        const serviceCard = e.target.closest('.service-card');
        if (serviceCard) {
            document.querySelectorAll('.service-card').forEach(card => card.classList.remove('selected'));
            serviceCard.classList.add('selected');
            selectedService = serviceCard.dataset.service;
        }
    });
    
    closePaymentModal.addEventListener('click', closePayment);
    checkPaymentBtn.addEventListener('click', checkPaymentStatus);
    copyUpiBtn.addEventListener('click', copyUpiId);
    
    phonePeBtn.addEventListener('click', () => openUPIApp('phonepe'));
    gPayBtn.addEventListener('click', () => openUPIApp('gpay'));
    paytmBtn.addEventListener('click', () => openUPIApp('paytm'));
    whatsappPayBtn.addEventListener('click', () => openUPIApp('whatsapp'));
    
    closeSuccessModal.addEventListener('click', closeSuccessPayment);
    doneSuccessBtn.addEventListener('click', closeSuccessPayment);
    closeFailedModal.addEventListener('click', closeFailedPayment);
    closeFailedBtn.addEventListener('click', closeFailedPayment);
    retryPaymentBtn.addEventListener('click', retryPayment);
    
    closeTimeoutModal.addEventListener('click', closeTimeoutPayment);
    closeTimeoutBtn.addEventListener('click', closeTimeoutPayment);
    generateNewQRBtn.addEventListener('click', regenerateQR);
    
    [userProfileModal, newConnectionModal, paymentModal, paymentSuccessModal, paymentFailedModal, paymentTimeoutModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                modal.classList.add('hidden');
                if (modal === paymentModal) {
                    stopPaymentTimer();
                }
            }
        });
    });

    billsContainer.addEventListener('click', (e) => {
        const payBtn = e.target.closest('.btn-pay');
        if (payBtn) {
            e.preventDefault();
            e.stopPropagation();
            const billId = payBtn.dataset.billid;
            const amount = payBtn.dataset.amount;
            console.log('💳 Pay button clicked:', billId, amount);
            openPaymentGateway(billId, amount);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [userProfileModal, newConnectionModal, paymentModal, paymentSuccessModal, paymentFailedModal, paymentTimeoutModal].forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                    if (modal === paymentModal) {
                        stopPaymentTimer();
                    }
                }
            });
        }
    });
}

// Copy UPI ID to Clipboard
async function copyUpiId() {
    const upiId = upiIdText.textContent;
    
    try {
        await navigator.clipboard.writeText(upiId);
        showToast('UPI ID copied to clipboard!', 'success');
        
        // Visual feedback
        copyUpiBtn.innerHTML = '<i data-feather="check"></i>';
        feather.replace();
        
        setTimeout(() => {
            copyUpiBtn.innerHTML = '<i data-feather="copy"></i>';
            feather.replace();
        }, 2000);
        
        console.log('📋 UPI ID copied:', upiId);
    } catch (err) {
        console.error('❌ Failed to copy:', err);
        showToast('Failed to copy UPI ID', 'error');
    }
}

// Loading Functions
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
        startLoadingMessages();
    } else {
        loadingOverlay.classList.add('hidden');
        stopLoadingMessages();
    }
}

function startLoadingMessages() {
    loadingMessageIndex = 0;
    loadingText.textContent = loadingMessages[0];
    
    loadingInterval = setInterval(() => {
        loadingMessageIndex = (loadingMessageIndex + 1) % loadingMessages.length;
        loadingText.textContent = loadingMessages[loadingMessageIndex];
    }, 1500);
}

function stopLoadingMessages() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
}

// Payment Status Check Functions
function showStatusCheck(show) {
    if (show) {
        statusCheckOverlay.classList.remove('hidden');
        startStatusCheckMessages();
    } else {
        statusCheckOverlay.classList.add('hidden');
        stopStatusCheckMessages();
    }
}

function startStatusCheckMessages() {
    statusCheckMessageIndex = 0;
    statusCheckText.textContent = statusCheckMessages[0];
    
    statusCheckInterval = setInterval(() => {
        statusCheckMessageIndex = (statusCheckMessageIndex + 1) % statusCheckMessages.length;
        statusCheckText.textContent = statusCheckMessages[statusCheckMessageIndex];
    }, 2000);
}

function stopStatusCheckMessages() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
}

// Payment Timer Functions (120 seconds)
function startPaymentTimer() {
    paymentTimeLeft = 120; // 2 minutes
    updateTimerDisplay();
    
    paymentTimer = setInterval(() => {
        paymentTimeLeft--;
        updateTimerDisplay();
        
        if (paymentTimeLeft <= 0) {
            stopPaymentTimer();
            closePayment();
            showTimeoutModal();
        }
    }, 1000);
    
    console.log('⏱️ Payment timer started (120 seconds)');
}

function stopPaymentTimer() {
    if (paymentTimer) {
        clearInterval(paymentTimer);
        paymentTimer = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(paymentTimeLeft / 60);
    const seconds = paymentTimeLeft % 60;
    paymentTimerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Timeout Modal Functions
function showTimeoutModal() {
    paymentTimeoutModal.classList.remove('hidden');
    feather.replace();
}

function closeTimeoutPayment() {
    paymentTimeoutModal.classList.add('hidden');
}

function regenerateQR() {
    closeTimeoutPayment();
    if (currentPaymentBill) {
        openPaymentGateway(currentPaymentBill['Bill ID'], currentPaymentBill.Amount);
    }
}

// Session Management
function checkSession() {
    const savedUser = localStorage.getItem('globeint_user');
    if (savedUser) {
        console.log('📱 Session found for user:', savedUser);
        currentUser = savedUser;
        showDashboard();
    } else {
        console.log('🔐 No session found, showing auth');
        showAuth();
    }
}

function showAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    userSection.classList.add('hidden');
}

function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    userSection.classList.remove('hidden');
    userIdDisplay.textContent = currentUser;
    loadAllBills();
    feather.replace();
}

// Auth Tab Switching
function switchAuthTab(tab) {
    authTabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
    authMessage.classList.add('hidden');
    feather.replace();
}

// Authentication Handlers
async function handleLogin(e) {
    e.preventDefault();
    const userId = document.getElementById('loginUserId').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!userId || !password) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    console.log('🔑 Attempting login for:', userId);
    showLoading(true);

    try {
        const response = await fetchWithRetry(`${API_URL}?action=login&userId=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`, 3);
        const data = await response.json();

        console.log('📥 Login response:', data);

        if (data.success) {
            currentUser = userId;
            localStorage.setItem('globeint_user', userId);
            showToast('Login successful', 'success');
            setTimeout(() => showDashboard(), 800);
        } else {
            showAuthMessage(data.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showAuthMessage('Connection error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const userId = document.getElementById('registerUserId').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (!userId || !password || !confirmPassword) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters', 'error');
        return;
    }

    console.log('✍️ Attempting registration for:', userId);
    showLoading(true);

    try {
        const response = await fetchWithRetry(API_URL, 3, {
            method: 'POST',
            body: JSON.stringify({
                action: 'register',
                userId: userId,
                password: password
            })
        });
        const data = await response.json();

        console.log('📥 Register response:', data);

        if (data.success) {
            showAuthMessage('Registration successful! Please login.', 'success');
            registerForm.reset();
            setTimeout(() => switchAuthTab('login'), 2000);
        } else {
            showAuthMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('❌ Register error:', error);
        showAuthMessage('Connection error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function handleLogout() {
    console.log('👋 Logging out user:', currentUser);
    currentUser = null;
    userCredentials = null;
    localStorage.removeItem('globeint_user');
    loginForm.reset();
    allBills = { mobile: [], electric: [], wifi: [] };
    showToast('Logged out successfully', 'success');
    setTimeout(() => showAuth(), 500);
}

// Fetch with Retry Logic
async function fetchWithRetry(url, retries = 3, options = {}) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🌐 Fetch attempt ${i + 1}/${retries}`);
            const response = await fetch(url, options);
            if (!response.ok && i < retries - 1) {
                console.warn(`⚠️ Response not OK, retrying... Status: ${response.status}`);
                await wait(1000 * (i + 1));
                continue;
            }
            return response;
        } catch (error) {
            console.error(`❌ Fetch error on attempt ${i + 1}:`, error);
            if (i === retries - 1) throw error;
            await wait(1000 * (i + 1));
        }
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Bill Management
function switchBillType(type) {
    console.log('📋 Switching to bill type:', type);
    currentBillType = type;
    billTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    const titles = {
        mobile: 'Mobile Bills',
        electric: 'Electric Bills',
        wifi: 'Wifi Bills'
    };
    sectionTitle.textContent = titles[type];
    
    displayBills();
    feather.replace();
}

async function loadAllBills() {
    if (!currentUser) {
        console.warn('⚠️ No user logged in, cannot load bills');
        return;
    }

    console.log('📊 Loading all bills for user:', currentUser);
    showLoading(true);

    try {
        const response = await fetchWithRetry(`${API_URL}?action=getAllBills&userId=${encodeURIComponent(currentUser)}`, 3);
        const data = await response.json();

        console.log('📥 Bills response:', data);

        if (data.success) {
            allBills.mobile = Array.isArray(data.mobile) ? data.mobile : [];
            allBills.electric = Array.isArray(data.electric) ? data.electric : [];
            allBills.wifi = Array.isArray(data.wifi) ? data.wifi : [];
            
            console.log('✅ Bills loaded:', {
                mobile: allBills.mobile.length,
                electric: allBills.electric.length,
                wifi: allBills.wifi.length
            });
            
            updateBillCounts();
            updateBillSummary();
            displayBills();
            await loadUserCredentials();
        } else {
            console.error('❌ Failed to load bills:', data.message);
            showToast('Failed to load bills', 'error');
        }
    } catch (error) {
        console.error('❌ Load bills error:', error);
        showToast('Connection error. Please refresh.', 'error');
    } finally {
        showLoading(false);
    }
}

function updateBillCounts() {
    const mobilePending = allBills.mobile.filter(b => b.Status === 'Pending').length;
    const electricPending = allBills.electric.filter(b => b.Status === 'Pending').length;
    const wifiPending = allBills.wifi.filter(b => b.Status === 'Pending').length;
    
    mobileCount.textContent = mobilePending;
    electricCount.textContent = electricPending;
    wifiCount.textContent = wifiPending;

    console.log('🔢 Bill counts updated:', { mobilePending, electricPending, wifiPending });
}

function updateBillSummary() {
    const allPendingBills = [
        ...allBills.mobile.filter(b => b.Status === 'Pending'),
        ...allBills.electric.filter(b => b.Status === 'Pending'),
        ...allBills.wifi.filter(b => b.Status === 'Pending')
    ];

    const totalCount = allPendingBills.length;
    const totalAmount = allPendingBills.reduce((sum, bill) => sum + (parseFloat(bill.Amount) || 0), 0);

    totalPendingBills.textContent = totalCount;
    totalPendingAmount.textContent = `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    console.log('💰 Bill summary updated:', { totalCount, totalAmount });
}

function calculateDaysUntilDue(dueDateStr) {
    if (!dueDateStr) return null;
    
    const parts = dueDateStr.split('/');
    if (parts.length !== 3) return null;
    
    const dueDate = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function getDueStatusBadge(daysUntilDue) {
    if (daysUntilDue === null) return '';
    
    if (daysUntilDue < 0) {
        return `<span class="due-status overdue">
            <i data-feather="alert-circle"></i>
            OVERDUE ${Math.abs(daysUntilDue)} days
        </span>`;
    } else if (daysUntilDue === 0) {
        return `<span class="due-status overdue">
            <i data-feather="alert-triangle"></i>
            DUE TODAY
        </span>`;
    } else if (daysUntilDue <= 3) {
        return `<span class="due-status due-soon">
            <i data-feather="clock"></i>
            Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}
        </span>`;
    } else if (daysUntilDue <= 7) {
        return `<span class="due-status upcoming">
            <i data-feather="calendar"></i>
            Due in ${daysUntilDue} days
        </span>`;
    }
    return '';
}

async function loadUserCredentials() {
    try {
        userCredentials = {
            'Created Date': 'N/A',
            'Last Login': new Date().toLocaleDateString('en-IN')
        };
        console.log('👤 User credentials loaded');
    } catch (error) {
        console.error('❌ Load user credentials error:', error);
    }
}

function displayBills() {
    const bills = allBills[currentBillType] || [];
    billsContainer.innerHTML = '';

    console.log(`📄 Displaying ${currentBillType} bills:`, bills.length);

    const pendingBills = bills.filter(bill => bill.Status === 'Pending');

    if (pendingBills.length === 0) {
        console.log('✨ No pending bills, showing empty state');
        billsContainer.innerHTML = `
            <div class="empty-state">
                <img src="https://i.postimg.cc/QNw35MTv/image.png" alt="All Caught Up" class="empty-state-image">
                <h3>All Caught Up!</h3>
                <p>You have no pending ${currentBillType} bills at the moment.</p>
            </div>
        `;
        return;
    }

    pendingBills.sort((a, b) => {
        const dateA = new Date(a['Due Date'].split('/').reverse().join('-'));
        const dateB = new Date(b['Due Date'].split('/').reverse().join('-'));
        return dateA - dateB;
    });

    pendingBills.forEach(bill => {
        const card = createBillCard(bill);
        billsContainer.appendChild(card);
    });

    feather.replace();
    console.log('✅ Bills displayed successfully');
}

function createBillCard(bill) {
    const card = document.createElement('div');
    card.className = 'bill-card';
    
    const amount = parseFloat(bill.Amount) || 0;
    const daysUntilDue = calculateDaysUntilDue(bill['Due Date']);
    const dueStatusBadge = getDueStatusBadge(daysUntilDue);
    
    card.innerHTML = `
        <div class="bill-header">
            <span class="bill-id">${bill['Bill ID'] || 'N/A'}</span>
            <span class="bill-status pending">PENDING</span>
        </div>
        <div class="bill-amount">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="bill-details">
            <div class="bill-detail">
                <i data-feather="calendar"></i>
                <span>${bill.Month || 'N/A'} ${bill.Year || ''}</span>
            </div>
            <div class="bill-detail">
                <i data-feather="clock"></i>
                <span>Due: ${bill['Due Date'] || 'N/A'}</span>
            </div>
        </div>
        ${dueStatusBadge}
        <div class="bill-actions">
            <button class="btn-small btn-pay" data-billid="${bill['Bill ID']}" data-amount="${amount}">
                <i data-feather="credit-card"></i>
                <span>Pay Now</span>
            </button>
        </div>
    `;
    
    return card;
}

// Payment Gateway Functions
function openPaymentGateway(billId, amount) {
    console.log('💳 Opening payment gateway for bill:', billId, 'Amount:', amount);
    
    const bills = allBills[currentBillType] || [];
    currentPaymentBill = bills.find(b => b['Bill ID'] === billId);
    
    if (!currentPaymentBill) {
        console.error('❌ Bill not found:', billId);
        showToast('Bill not found', 'error');
        return;
    }

    document.getElementById('paymentBillId').textContent = billId;
    document.getElementById('paymentBillType').textContent = currentBillType.toUpperCase();
    document.getElementById('paymentAmount').textContent = `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    generateUPIQRCode(amount);
    startPaymentTimer();
    
    paymentModal.classList.remove('hidden');
    feather.replace();
}

function generateUPIQRCode(amount) {
    const upiId = 'anas.lila@ibl';
    const name = 'GlobeINT';
    const amountValue = parseFloat(amount).toFixed(2);
    
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountValue}&cu=INR`;
    
    console.log('🔗 UPI String:', upiString);
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}`;
    
    document.getElementById('qrCodeImage').src = qrCodeUrl;
    console.log('✅ QR Code generated');
}

// UPI Deep Links
function openUPIApp(app) {
    if (!currentPaymentBill) {
        showToast('No bill selected', 'error');
        return;
    }

    const upiId = 'anas.lila@ibl';
    const name = 'GlobeINT';
    const amount = parseFloat(currentPaymentBill.Amount).toFixed(2);
    const note = `Payment for ${currentPaymentBill['Bill ID']}`;
    
    let deepLink = '';
    
    switch(app) {
        case 'phonepe':
            deepLink = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
            break;
        case 'gpay':
            deepLink = `tez://upi/pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
            break;
        case 'paytm':
            deepLink = `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
            break;
        case 'whatsapp':
            deepLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
            break;
    }
    
    console.log(`📱 Opening ${app}:`, deepLink);
    window.location.href = deepLink;
    
    setTimeout(() => {
        showToast(`Opening ${app.toUpperCase()}... If the app doesn't open, use the QR code.`, 'success');
    }, 500);
}

function closePayment() {
    paymentModal.classList.add('hidden');
    stopPaymentTimer();
    currentPaymentBill = null;
    console.log('❌ Payment modal closed');
}

// Check Payment Status
async function checkPaymentStatus() {
    if (!currentPaymentBill) {
        showToast('No bill selected', 'error');
        return;
    }

    const billId = currentPaymentBill['Bill ID'];
    const amount = parseFloat(currentPaymentBill.Amount);
    console.log('🔍 Checking payment status for bill:', billId);

    closePayment();
    showStatusCheck(true);

    try {
        const response = await fetchWithRetry(API_URL, 3, {
            method: 'POST',
            body: JSON.stringify({
                action: 'payBill',
                billId: billId,
                billType: currentBillType
            })
        });
        const data = await response.json();

        console.log('📥 Payment response:', data);

        showStatusCheck(false);

        if (data.success) {
            showPaymentSuccess(billId, amount);
            await loadAllBills();
        } else {
            showPaymentFailed(billId, amount, data.message || 'Transaction not found');
        }
    } catch (error) {
        console.error('❌ Payment check error:', error);
        showStatusCheck(false);
        showPaymentFailed(billId, amount, 'Connection error');
    }
}

function showPaymentSuccess(billId, amount) {
    document.getElementById('successBillId').textContent = billId;
    document.getElementById('successAmount').textContent = `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('successDate').textContent = new Date().toLocaleDateString('en-IN');
    
    paymentSuccessModal.classList.remove('hidden');
    feather.replace();
}

function closeSuccessPayment() {
    paymentSuccessModal.classList.add('hidden');
}

function showPaymentFailed(billId, amount, reason) {
    document.getElementById('failedBillId').textContent = billId;
    document.getElementById('failedAmount').textContent = `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('failedReason').textContent = reason;
    
    paymentFailedModal.classList.remove('hidden');
    feather.replace();
}

function closeFailedPayment() {
    paymentFailedModal.classList.add('hidden');
}

function retryPayment() {
    closeFailedPayment();
    if (currentPaymentBill) {
        openPaymentGateway(currentPaymentBill['Bill ID'], currentPaymentBill.Amount);
    }
}

// Pay All Functionality
async function handlePayAll() {
    const allPendingBills = [
        ...allBills.mobile.filter(b => b.Status === 'Pending'),
        ...allBills.electric.filter(b => b.Status === 'Pending'),
        ...allBills.wifi.filter(b => b.Status === 'Pending')
    ];

    if (allPendingBills.length === 0) {
        showToast('No pending bills to pay', 'error');
        return;
    }

    const totalAmount = allPendingBills.reduce((sum, bill) => sum + (parseFloat(bill.Amount) || 0), 0);

    if (!confirm(`Pay all ${allPendingBills.length} pending bills totaling ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}?`)) {
        return;
    }

    currentPaymentBill = { 
        'Bill ID': 'ALL_BILLS', 
        Amount: totalAmount 
    };
    openPaymentGateway('ALL_BILLS', totalAmount);
}

// New Connection Modal
function openNewConnectionModal() {
    newConnectionModal.classList.remove('hidden');
    selectedService = null;
    document.querySelectorAll('.service-card').forEach(card => card.classList.remove('selected'));
    feather.replace();
}

function closeNewConnection() {
    newConnectionModal.classList.add('hidden');
}

function contactExpert() {
    const service = selectedService || 'general inquiry';
    const lastLogin = userCredentials?.['Last Login'] || new Date().toLocaleDateString('en-IN');
    
    const message = `Hello! I'm ${currentUser} and I'm interested in a new ${service} connection.%0A%0AUser ID: ${currentUser}%0ALast Login: ${lastLogin}%0AService: ${service}%0A%0APlease contact me with more details.`;
    
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    
    console.log('📱 Opening WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
}

// User Profile Modal
function openUserProfile() {
    console.log('👤 Opening user profile');
    userProfileModal.classList.remove('hidden');
    populateUserProfile();
    feather.replace();
}

function closeUserProfile() {
    userProfileModal.classList.add('hidden');
}

function populateUserProfile() {
    document.getElementById('profileUserId').textContent = currentUser;
    
    if (userCredentials) {
        document.getElementById('profileCreated').textContent = userCredentials['Created Date'] || 'N/A';
        document.getElementById('profileLastLogin').textContent = userCredentials['Last Login'] || 'N/A';
    } else {
        document.getElementById('profileCreated').textContent = 'N/A';
        document.getElementById('profileLastLogin').textContent = new Date().toLocaleDateString('en-IN');
    }
    
    const totalBillsCount = allBills.mobile.length + allBills.electric.length + allBills.wifi.length;
    const pendingBillsCount = 
        allBills.mobile.filter(b => b.Status === 'Pending').length +
        allBills.electric.filter(b => b.Status === 'Pending').length +
        allBills.wifi.filter(b => b.Status === 'Pending').length;
    const paidBillsCount = totalBillsCount - pendingBillsCount;
    
    document.getElementById('totalBills').textContent = totalBillsCount;
    document.getElementById('pendingBills').textContent = pendingBillsCount;
    document.getElementById('paidBills').textContent = paidBillsCount;
}

// UI Helper Functions
function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
    authMessage.classList.remove('hidden');
    
    setTimeout(() => {
        authMessage.classList.add('hidden');
    }, 5000);
}

function showToast(message, type = 'success') {
    const toastText = toast.querySelector('.toast-text');
    
    if (toastText) {
        toastText.textContent = message;
    } else {
        toast.innerHTML = `<span class="toast-text">${message}</span>`;
    }
    
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

// Auto-refresh bills every 5 minutes
setInterval(() => {
    if (currentUser && loadingOverlay.classList.contains('hidden')) {
        console.log('🔄 Auto-refreshing bills...');
        loadAllBills();
    }
}, 300000);

// Console branding
console.log('%c🌐 GlobeINT Professional', 'color: #d40000; font-size: 22px; font-weight: bold;');
console.log('%cInnovation made for you...', 'color: #666; font-size: 13px; font-style: italic;');
console.log('%cVersion 1.06 - Secure & Advanced', 'color: #28a745; font-size: 11px; font-weight: bold;');
