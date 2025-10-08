// public/modules/dom.js

export const DOMElements = {
    // Auth UI
    authContainer: document.getElementById('auth-container'),
    appContainer: document.getElementById('app-container'),
    loginView: document.getElementById('login-view'),
    registerView: document.getElementById('register-view'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    registerEmail: document.getElementById('register-email'),
    registerPassword: document.getElementById('register-password'),
    loginError: document.getElementById('login-error'),
    registerError: document.getElementById('register-error'),
    showRegisterBtn: document.getElementById('show-register'),
    showLoginBtn: document.getElementById('show-login'),
    currentUserEmail: document.getElementById('current-user-email'),
    logoutBtn: document.getElementById('btn-logout'),

    // App Header & Nav
    statStudentCount: document.getElementById('stat-student-count'),
    statGroupCount: document.getElementById('stat-group-count'),
    statTotalPoints: document.getElementById('stat-total-points'),
    statAvgPoints: document.getElementById('stat-avg-points'),
    navItems: document.querySelectorAll('.nav-item'),
    
    // Main Content Views
    views: document.querySelectorAll('#main-content > div'),
    studentCardsContainer: document.getElementById('student-cards-container'),
    studentTableBody: document.querySelector('#student-table tbody'),
    studentTableHeader: document.querySelector('#student-table thead'),
    groupTableBody: document.querySelector('#group-table tbody'),
    recordTableBody: document.querySelector('#record-table tbody'),
    rewardsContainer: document.getElementById('rewards-container'),
    leaderboardList: document.getElementById('leaderboard-list'),
    leaderboardTitle: document.getElementById('leaderboard-title'),
    leaderboardToggle: document.querySelector('.leaderboard-toggle'),

    // Modals & Forms
    studentModal: document.getElementById('student-modal'),
    studentForm: document.getElementById('student-form'),
    studentModalTitle: document.getElementById('student-modal-title'),
    studentIdInput: document.getElementById('student-id'),
    studentIdDisplayInput: document.getElementById('student-id-display'),
    studentNameInput: document.getElementById('student-name'),
    studentGroupSelect: document.getElementById('student-group'),
    
    groupModal: document.getElementById('group-modal'),
    groupForm: document.getElementById('group-form'),
    groupIdInput: document.getElementById('group-id'),
    groupNameInput: document.getElementById('group-name'),
    
    rewardModal: document.getElementById('reward-modal'),
    rewardForm: document.getElementById('reward-form'),
    rewardModalTitle: document.getElementById('reward-modal-title'),
    rewardIdInput: document.getElementById('reward-id'),
    rewardNameInput: document.getElementById('reward-name'),
    rewardCostInput: document.getElementById('reward-cost'),
    
    redeemModal: document.getElementById('redeem-modal'),
    redeemForm: document.getElementById('redeem-form'),
    redeemRewardIdInput: document.getElementById('redeem-reward-id'),
    redeemRewardName: document.getElementById('redeem-reward-name'),
    redeemRewardCost: document.getElementById('redeem-reward-cost'),
    redeemStudentSelect: document.getElementById('redeem-student-select'),
    
    groupPointsModal: document.getElementById('group-points-modal'),
    groupPointsForm: document.getElementById('group-points-form'),
    groupPointsSelect: document.getElementById('group-points-select'),
    groupPointsAmount: document.getElementById('group-points-amount'),
    groupPointsReason: document.getElementById('group-points-reason'),
    
    pointsModal: document.getElementById('points-modal'),
    pointsForm: document.getElementById('points-form'),
    pointsStudentName: document.getElementById('points-student-name'),
    pointsStudentIdInput: document.getElementById('points-student-id-input'),
    pointsChangeAmount: document.getElementById('points-change-amount'),
    pointsChangeReason: document.getElementById('points-change-reason'),
    
    allPointsModal: document.getElementById('all-points-modal'),
    allPointsForm: document.getElementById('all-points-form'),
    allPointsAmount: document.getElementById('all-points-amount'),
    allPointsReason: document.getElementById('all-points-reason'),
    
    turntableCanvas: document.getElementById('turntable-canvas'),
    turntableCostInput: document.getElementById('turntable-cost-input'),
    turntablePrizeTableBody: document.querySelector('#turntable-prize-table tbody'),
    turntablePrizeModal: document.getElementById('turntable-prize-modal'),
    turntablePrizeForm: document.getElementById('turntable-prize-form'),
    turntablePrizeModalTitle: document.getElementById('turntable-prize-modal-title'),
    turntablePrizeIdInput: document.getElementById('turntable-prize-id'),
    turntablePrizeNameInput: document.getElementById('turntable-prize-name'),
    
    spinSelectModal: document.getElementById('spin-select-modal'),
    spinSelectForm: document.getElementById('spin-select-form'),
    spinCostDisplay: document.getElementById('spin-cost-display'),
    spinStudentSelect: document.getElementById('spin-student-select'),
    
    notificationContainer: document.getElementById('notification-container'),
    
    confirmModal: document.getElementById('confirm-modal'),
    confirmModalText: document.getElementById('confirm-modal-text'),
    confirmOkBtn: document.getElementById('confirm-ok-btn'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
    confirmCloseBtn: document.getElementById('confirm-close-btn'),
    
    individualRecordModal: document.getElementById('individual-record-modal'),
    individualRecordModalTitle: document.getElementById('individual-record-modal-title'),
    individualRecordTableBody: document.getElementById('individual-record-table-body'),
    
    bulkGroupModal: document.getElementById('bulk-group-modal'),
    bulkGroupForm: document.getElementById('bulk-group-form'),
    bulkGroupModalTitle: document.getElementById('bulk-group-modal-title'),
    bulkGroupName: document.getElementById('bulk-group-name'),
    bulkGroupIdInput: document.getElementById('bulk-group-id'),
    unassignedStudentsList: document.getElementById('unassigned-students-list'),
    assignedStudentsList: document.getElementById('assigned-students-list'),
    
    // Controls
    dashboardSortControls: document.querySelector('.sort-controls'),
    searchInput: document.getElementById('search-input'),
    importFileInput: document.getElementById('import-file-input'),

    // Print Center
    printStudentSelect: document.getElementById('print-student-select'),
    btnPrintSummary: document.getElementById('btn-print-summary'),
    btnPrintDetails: document.getElementById('btn-print-details'),

    // Data Management
    btnClearPointsData: document.getElementById('btn-clear-points-data'),
    btnClearAllData: document.getElementById('btn-clear-all-data'),

    
    btnOpenTextImport: document.getElementById('btn-open-text-import'),
    textImportModal: document.getElementById('text-import-modal'),
    textImportForm: document.getElementById('text-import-form'),
    textImportArea: document.getElementById('text-import-area'),
};