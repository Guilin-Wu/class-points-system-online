// public/modules/render.js

import { state } from './state.js';
import { DOMElements } from './dom.js';
import { getAchievement } from './ui.js';

// --- Private Render Functions ---

function renderStats() {
    const studentCount = state.students.length;
    const totalPoints = state.students.reduce((sum, student) => sum + student.points, 0);
    DOMElements.statStudentCount.innerText = studentCount;
    DOMElements.statGroupCount.innerText = state.groups.length;
    DOMElements.statTotalPoints.innerText = totalPoints;
    DOMElements.statAvgPoints.innerText = studentCount > 0 ? (totalPoints / studentCount).toFixed(1) : 0;
}

function renderDashboard(searchTerm = '') {
    const container = DOMElements.studentCardsContainer;
    container.innerHTML = '';

    let studentsToRender = state.students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (studentsToRender.length === 0) {
        container.innerHTML = '<p>没有找到符合条件的学生。</p>';
        return;
    }

    const { column, direction } = state.dashboardSortState;
    studentsToRender.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        let comparison = (column === 'points')
            ? (valA || 0) - (valB || 0)
            : String(valA || '').localeCompare(String(valB || ''), 'zh-Hans-CN');
        return direction === 'desc' ? comparison * -1 : comparison;
    });

    studentsToRender.forEach(s => {
        const card = document.createElement('div');
        const achievement = getAchievement(s.totalearnedpoints);
        card.className = `student-card ${achievement ? achievement.className : ''}`;
        if (s.justLeveledUp) {
            card.classList.add('level-up-fx');
            delete s.justLeveledUp;
        }
        card.dataset.id = s.id;
        const groupName = state.groups.find(g => g.id === s.group)?.name || '未分组';
        const titleHTML = achievement ? `<span class="achievement-title" data-tier="${achievement.title}">${achievement.title}</span>` : '';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="name-line">
                    <span class="name">${s.name}</span>
                    ${titleHTML} 
                </div>
                <span class="group">${groupName}</span>
            </div>
            <div class="card-body">
                <div class="label">当前积分</div>
                <div class="points">${s.points}</div>
            </div>
            <div class="card-actions">
                <span class="icon-btn points-btn" title="调整积分">➕➖</span>
                <div class="card-admin-icons">
                    <span class="icon-btn record-btn" title="查看记录">📄</span>
                    <span class="icon-btn edit-btn" title="编辑学生">✏️</span>
                    <span class="icon-btn delete-btn" title="删除学生">🗑️</span>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

function renderLeaderboard() {
    const listElement = DOMElements.leaderboardList;
    if (!listElement) return;

    DOMElements.leaderboardToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.type === state.leaderboardType));

    let title = '', sortProperty = '', unit = '积分';
    let studentsToList = [];

    switch (state.leaderboardType) {
        case 'total':
            title = '🏆 累计积分排行榜';
            sortProperty = 'totalearnedpoints';
            studentsToList = [...state.students];
            break;
        case 'deduction':
            title = '🏆 扣分积分排行榜';
            sortProperty = 'totaldeductions';
            studentsToList = state.students.filter(s => (s.totaldeductions || 0) > 0);
            unit = '分';
            break;
        default:
            title = '🏆 实时积分排行榜';
            sortProperty = 'points';
            studentsToList = [...state.students];
            break;
    }

    DOMElements.leaderboardTitle.innerText = title;
    studentsToList.sort((a, b) => (b[sortProperty] || 0) - (a[sortProperty] || 0));
    listElement.innerHTML = '';

    if (studentsToList.length === 0) {
        listElement.innerHTML = '<li>暂无相关数据</li>';
        return;
    }

    studentsToList.forEach((student, index) => {
        const li = document.createElement('li');
        const points = student[sortProperty] || 0;
        li.innerHTML = `<span class="rank">${index + 1}.</span><span class="name">${student.name}</span><span class="points">${points} ${unit}</span>`;
        listElement.appendChild(li);
    });
}

function renderStudentTable() {
    const tbody = DOMElements.studentTableBody;
    tbody.innerHTML = '';
    const { column, direction } = state.sortState;
    const sortedStudents = [...state.students];
    sortedStudents.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        let comp = 0;
        if (column === 'points' || column === 'totalearnedpoints') {
            comp = (valA || 0) - (valB || 0);
        } else {
            comp = String(valA || '').localeCompare(String(valB || ''), 'zh-Hans-CN');
        }
        return direction === 'desc' ? comp * -1 : comp;
    });

    sortedStudents.forEach(s => {
        const groupName = state.groups.find(g => g.id === s.group)?.name || '未分组';
        const tr = document.createElement('tr');
        tr.dataset.id = s.id;
        tr.innerHTML = `
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${groupName}</td>
            <td>${s.points}</td>
            <td class="actions">
                <button class="btn btn-info btn-sm record-btn">记录</button>
                <button class="btn btn-primary btn-sm edit-btn">编辑</button>
                <button class="btn btn-danger btn-sm delete-btn">删除</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function renderGroupTable() {
    const tbody = DOMElements.groupTableBody;
    tbody.innerHTML = '';
    state.groups.forEach(g => {
        const members = state.students.filter(s => s.group === g.id);
        const avgPoints = members.length ? (members.reduce((sum, s) => sum + s.points, 0) / members.length).toFixed(1) : 0;
        const tr = document.createElement('tr');
        tr.dataset.id = g.id;
        tr.innerHTML = `
            <td>${g.name}</td>
            <td>${members.length}</td>
            <td>${avgPoints}</td>
            <td class="actions">
                <button class="btn btn-info btn-sm bulk-edit-btn">管理成员</button>
                <button class="btn btn-primary btn-sm edit-btn">编辑</button>
                <button class="btn btn-danger btn-sm delete-btn">删除</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function renderRewards() {
    const container = DOMElements.rewardsContainer;
    container.innerHTML = '';
    if (!state.rewards || state.rewards.length === 0) {
        container.innerHTML = '<p>商城里还没有任何奖品，快去上架一个吧！</p>';
        return;
    }
    state.rewards.forEach(r => {
        const card = document.createElement('div');
        card.className = 'reward-card';
        card.dataset.id = r.id;
        card.innerHTML = `
            <div class="name">${r.name}</div>
            <div class="cost">${r.cost}</div>
            <div class="actions">
                <button class="btn btn-green redeem-btn">立即兑换</button>
                <div class="admin-actions">
                    <span class="icon-btn edit-btn">✏️</span>
                    <span class="icon-btn delete-btn">🗑️</span>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

function renderRecords() {
    const tbody = DOMElements.recordTableBody;
    tbody.innerHTML = '';
    if (!state.records) return;
    state.records.forEach(r => { // Assumes records are already sorted by backend
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.time}</td>
            <td>${r.studentname}</td>
            <td>${r.change}</td>
            <td>${r.reason}</td>
            <td>${r.finalpoints}</td>`;
        tbody.appendChild(tr);
    });
}

function renderTurntablePrizes() {
    const tbody = DOMElements.turntablePrizeTableBody;
    if (!tbody) return;
    tbody.innerHTML = '';
    state.turntablePrizes.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.id = p.id;
        tr.innerHTML = `
            <td>${p.text}</td>
            <td class="actions">
                <button class="btn btn-primary btn-sm edit-btn">编辑</button>
                <button class="btn btn-danger btn-sm delete-btn">删除</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function renderSortIndicators() {
    const { column, direction } = state.sortState;
    const headers = DOMElements.studentTableHeader.querySelectorAll('th.sortable');
    headers.forEach(h => {
        const indicator = h.querySelector('span');
        h.classList.remove('sorted-asc', 'sorted-desc');
        if (indicator) indicator.innerText = '';
        if (h.dataset.sort === column) {
            h.classList.add(`sorted-${direction}`);
            if (indicator) indicator.innerText = direction === 'asc' ? ' ▲' : ' ▼';
        }
    });
}

function renderDashboardSortIndicators() {
    const { column, direction } = state.dashboardSortState;
    const buttons = DOMElements.dashboardSortControls.querySelectorAll('.sort-btn');
    buttons.forEach(btn => {
        const indicator = btn.querySelector('.sort-indicator');
        btn.classList.remove('active');
        if (indicator) indicator.textContent = '';
        if (btn.dataset.sort === column) {
            btn.classList.add('active');
            if (indicator) indicator.textContent = direction === 'asc' ? ' ▲' : ' ▼';
        }
    });
}

// --- Exported Render Functions ---

/**
 * 主渲染函数，调用所有常规渲染函数来更新整个应用UI
 */
export function renderApp() {
    if (!state) return;
    renderStats();
    renderDashboard(DOMElements.searchInput.value);
    renderLeaderboard();
    renderStudentTable();
    renderGroupTable();
    renderRewards();
    renderRecords();
    renderTurntablePrizes();
    renderSortIndicators();
    renderDashboardSortIndicators();
}

/**
 * 专门用于渲染“个人积分记录”弹窗内容的函数
 * @param {string} studentId - 要显示记录的学生ID
 */
export function renderIndividualRecords(studentId) {
    const tbody = DOMElements.individualRecordTableBody;
    tbody.innerHTML = '';
    const studentRecords = state.records.filter(r => r.studentid === studentId);
    if (studentRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">该学生暂无积分记录。</td></tr>';
        return;
    }
    studentRecords.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.time}</td>
            <td>${r.change}</td>
            <td>${r.reason}</td>
            <td>${r.finalpoints}</td>`;
        tbody.appendChild(tr);
    });
}

/**
 * 专门用于渲染“批量管理小组成员”弹窗内容的函数
 * @param {string} groupId - 正在管理的的小组ID
 */
export function renderBulkGroupEditor(groupId) {
    const unassignedList = DOMElements.unassignedStudentsList;
    const assignedList = DOMElements.assignedStudentsList;
    unassignedList.innerHTML = '';
    assignedList.innerHTML = '';

    const unassignedStudents = state.students.filter(s => !s.group || s.group === '');
    const assignedStudents = state.students.filter(s => s.group === groupId);

    const createLi = (student) => {
        const li = document.createElement('li');
        li.dataset.id = student.id;
        li.innerText = student.name;
        return li;
    };

    unassignedStudents.forEach(s => unassignedList.appendChild(createLi(s)));
    assignedStudents.forEach(s => assignedList.appendChild(createLi(s)));
}

/**
 * 专门用于渲染“打印中心”的学生下拉列表
 */
export function renderPrintStudentSelect() {
    const select = DOMElements.printStudentSelect;
    if (!select) return;
    select.innerHTML = '<option value="">-- 请选择学生 --</option>';
    [...state.students]
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN'))
        .forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            select.add(option);
        });
}