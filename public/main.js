// public/main.js (最终完整版)

import { state, appStatus } from './modules/state.js';
import { DOMElements } from './modules/dom.js';
import * as ui from './modules/ui.js';
import * as api from './modules/api.js';
// [修复] 导入所有需要的渲染函数
import { renderApp, renderIndividualRecords, renderBulkGroupEditor, renderPrintStudentSelect } from './modules/render.js';
import { createHandlers } from './modules/handlers.js';
import { createPrint } from './modules/print.js';

// --- Main App Object ---
const App = {
    // 模块引用
    state,
    status: appStatus,
    dom: DOMElements,
    ui,
    api,
    
    // 主渲染函数
    render: renderApp,

    // [修复] 创建一个对象专门存放需要独立调用的渲染函数
    renderers: {
        renderIndividualRecords,
        renderBulkGroupEditor,
        renderPrintStudentSelect,
    },

    // --- Core App Logic ---
    async init() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            this.dom.currentUserEmail.textContent = user.email;
        }

        this.print = createPrint(this);
        this.handlers = createHandlers(this);
        this.setupEventListeners();
        await this.loadData();
    },

    async loadData() {
        try {
            const fetchedData = await this.api.fetchApi('/data');
            // 将获取的数据合并到 state
            Object.assign(this.state, fetchedData);
            this.render();
        } catch (error) {
            if (!error.message.includes('认证失败')) {
                this.ui.showNotification(error.message, 'error');
            }
        }
    },

    setupEventListeners() {
        // Auth Listeners
        this.dom.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.dom.loginError.textContent = '';
            try {
                await this.api.login(this.dom.loginEmail.value, this.dom.loginPassword.value);
                this.run();
            } catch (err) {
                this.dom.loginError.textContent = err.message;
            }
        });

        this.dom.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.dom.registerError.textContent = '';
            try {
                await this.api.register(this.dom.registerEmail.value, this.dom.registerPassword.value);
                this.dom.registerView.classList.add('hidden');
                this.dom.loginView.classList.remove('hidden');
                this.dom.loginError.textContent = '注册成功！请登录。';
            } catch (err) {
                this.dom.registerError.textContent = err.message;
            }
        });

        this.dom.showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.dom.loginView.classList.add('hidden');
            this.dom.registerView.classList.remove('hidden');
            this.dom.loginError.textContent = '';
        });

        this.dom.showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.dom.registerView.classList.add('hidden');
            this.dom.loginView.classList.remove('hidden');
            this.dom.registerError.textContent = '';
        });

        this.dom.logoutBtn.addEventListener('click', this.api.logout);

        // --- App Event Listeners ---
        this.dom.navItems.forEach(i => i.addEventListener('click', e => this.handlers.handleNavClick(e)));
        document.querySelectorAll('.modal .close-btn').forEach(b => b.addEventListener('click', e => this.ui.closeModal(e.target.closest('.modal'))));
        
        // Forms
        this.dom.studentForm.addEventListener('submit', e => this.handlers.handleStudentFormSubmit(e));
        this.dom.groupForm.addEventListener('submit', e => this.handlers.handleGroupFormSubmit(e));
        this.dom.rewardForm.addEventListener('submit', e => this.handlers.handleRewardFormSubmit(e));
        this.dom.redeemForm.addEventListener('submit', e => this.handlers.handleRedeemFormSubmit(e));
        this.dom.groupPointsForm.addEventListener('submit', e => this.handlers.handleGroupPointsFormSubmit(e));
        this.dom.pointsForm.addEventListener('submit', e => this.handlers.handlePointsFormSubmit(e));
        this.dom.allPointsForm.addEventListener('submit', e => this.handlers.handleAllPointsFormSubmit(e));
        this.dom.turntablePrizeForm.addEventListener('submit', e => this.handlers.handleTurntablePrizeFormSubmit(e));
        this.dom.spinSelectForm.addEventListener('submit', e => this.handlers.handleSpinSelectFormSubmit(e));
        this.dom.bulkGroupForm.addEventListener('submit', e => this.handlers.handleBulkGroupFormSubmit(e));

        // Buttons
        document.getElementById('btn-add-student').addEventListener('click', () => this.handlers.openStudentModal());
        document.getElementById('btn-add-group').addEventListener('click', () => this.handlers.openGroupModal());
        document.getElementById('btn-add-reward').addEventListener('click', () => this.handlers.openRewardModal());
        document.getElementById('btn-add-group-points').addEventListener('click', () => this.handlers.openGroupPointsModal());
        document.getElementById('btn-add-all-points').addEventListener('click', () => this.handlers.openAllPointsModal());
        document.getElementById('btn-add-turntable-prize').addEventListener('click', () => this.handlers.openTurntablePrizeModal());
        document.getElementById('btn-spin').addEventListener('click', () => this.handlers.openSpinSelectModal());
        
        // Data I/O
        document.getElementById('btn-export-data').addEventListener('click', () => this.exportData());
        document.getElementById('btn-import-data').addEventListener('click', () => this.dom.importFileInput.click());
        this.dom.importFileInput.addEventListener('change', e => this.importData(e));

        // Dynamic content clicks
        this.dom.studentCardsContainer.addEventListener('click', e => this.handlers.handleCardClick(e));
        this.dom.rewardsContainer.addEventListener('click', e => this.handlers.handleRewardCardClick(e));
        this.dom.studentTableBody.addEventListener('click', e => this.handlers.handleStudentTableClick(e));
        this.dom.studentTableHeader.addEventListener('click', e => this.handlers.handleSortClick(e));
        this.dom.groupTableBody.addEventListener('click', e => this.handlers.handleGroupTableClick(e));
        this.dom.unassignedStudentsList.addEventListener('click', e => this.handlers.handleStudentListItemClick(e, 'unassigned'));
        this.dom.assignedStudentsList.addEventListener('click', e => this.handlers.handleStudentListItemClick(e, 'assigned'));
        this.dom.leaderboardToggle.addEventListener('click', e => this.handlers.handleLeaderboardToggle(e));
        this.dom.turntablePrizeTableBody.addEventListener('click', e => this.handlers.handleTurntablePrizeTableClick(e));
        
        // Other controls
        this.dom.searchInput.addEventListener('input', e => this.render.renderDashboard(e.target.value));
        this.dom.dashboardSortControls.addEventListener('click', e => this.handlers.handleDashboardSortClick(e));
        this.dom.turntableCostInput.addEventListener('change', async e => {
            const cost = parseInt(e.target.value) || 0;
            try {
                await this.api.updateTurntableCost(cost);
                this.state.turntableCost = cost;
            } catch (err) {
                this.ui.showNotification(err.message, 'error');
            }
        });

        // Print
        this.dom.btnPrintSummary.addEventListener('click', () => this.print.summary());
        this.dom.btnPrintDetails.addEventListener('click', () => this.print.details());
    },

    // --- Data Import/Export ---
    exportData() {
        const dataToExport = {
            students: this.state.students,
            groups: this.state.groups,
            rewards: this.state.rewards,
            records: this.state.records,
            turntablePrizes: this.state.turntablePrizes,
            turntableCost: this.state.turntableCost,
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `class_data_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        const fileName = file.name.toLowerCase();
        const targetInput = e.target;
        const clearFileInput = () => { targetInput.value = ''; };

        if (fileName.endsWith('.json')) {
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!data.students || !data.groups) throw new Error('JSON文件内容格式不正确');
                    await this.api.importJsonData(data);
                    this.ui.showNotification('JSON数据完整导入成功！');
                    await this.loadData();
                } catch (err) { this.ui.showNotification(`导入失败: ${err.message}`, 'error'); } 
                finally { clearFileInput(); }
            };
            reader.readAsText(file);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            reader.onload = async (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const excelData = XLSX.utils.sheet_to_json(worksheet);
                    if (excelData.length === 0) throw new Error('Excel文件为空或格式不正确');
                    if (!excelData[0].hasOwnProperty('id') || !excelData[0].hasOwnProperty('name')) throw new Error('Excel文件必须包含 "id" 和 "name" 两列');
                    const result = await this.api.importStudentsFromExcel(excelData);
                    this.ui.showNotification(result.message || '学生导入成功');
                    await this.loadData();
                } catch (err) { this.ui.showNotification(`导入失败: ${err.message}`, 'error'); } 
                finally { clearFileInput(); }
            };
            reader.readAsArrayBuffer(file);
        } else {
            this.ui.showNotification('不支持的文件格式！请选择.json, .xlsx或.xls文件。', 'error');
            clearFileInput();
        }
    },

    // --- App Entry Point ---
    run() {
        this.dom.authContainer.classList.add('hidden');
        this.dom.appContainer.classList.remove('hidden');
        this.init();
    }
};

// --- Application Start ---
// 总是先设置认证相关的监听器
App.setupEventListeners();

// 然后检查是否存在token
if (localStorage.getItem('authToken')) {
    App.run();
}
// 如果没有token，什么也不做，用户会停留在默认显示的登录界面