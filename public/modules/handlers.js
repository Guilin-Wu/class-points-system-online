// 注意：这个模块几乎依赖所有其他模块
import * as api from './api.js';
import * as ui from './ui.js';

/**
 * 创建并返回包含所有事件处理器的对象
 * @param {object} App - 主应用实例，用于访问 state, DOMElements, 和其他方法
 * @returns {object} - 包含所有事件处理器函数的对象
 */
export function createHandlers(App) {
    
    // --- Handlers Object ---
    const handlers = {

        // --- Navigation & Sorting ---
        handleNavClick: (e) => {
            const view = e.currentTarget.dataset.view;
            App.dom.navItems.forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');
            App.dom.views.forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${view}`).classList.add('active');
            
            if (view === 'turntable') {
                // 调用正确的 initTurntable
                handlers.initTurntable();
                App.dom.turntableCostInput.value = App.state.turntableCost;
            }
            if (view === 'print') { 
                // [修复] 调用挂载在 App.renderers 上的独立渲染函数
                App.renderers.renderPrintStudentSelect(); 
            }
        },


        handleDashboardSortClick: (e) => {
            const btn = e.target.closest('.sort-btn');
            if (!btn) return;
            const sortKey = btn.dataset.sort;
            let newDirection = (sortKey === 'name') ? 'asc' : 'desc';
            if (App.state.dashboardSortState.column === sortKey) {
                newDirection = App.state.dashboardSortState.direction === 'asc' ? 'desc' : 'asc';
            }
            App.state.dashboardSortState = { column: sortKey, direction: newDirection };
            App.render();
        },

        handleSortClick: (e) => {
            const h = e.target.closest('th.sortable');
            if (!h) return;
            const sKey = h.dataset.sort;
            let nDir = 'asc';
            if (App.state.sortState.column === sKey) {
                nDir = App.state.sortState.direction === 'asc' ? 'desc' : 'asc';
            }
            App.state.sortState = { column: sKey, direction: nDir };
            App.render();
        },

        handleLeaderboardToggle: (e) => {
            const b = e.target.closest('.toggle-btn');
            if (!b) return;
            App.state.leaderboardType = b.dataset.type;
            App.render();
        },

        // --- Form Submissions ---
        handleStudentFormSubmit: async (e) => {
            e.preventDefault();
            const id = App.dom.studentIdInput.value;
            const studentId = App.dom.studentIdDisplayInput.value.trim();
            const name = App.dom.studentNameInput.value.trim();
            const group = App.dom.studentGroupSelect.value;
            if (!studentId || !name) return ui.showNotification('ID和姓名不能为空!', 'error');
            
            try {
                const action = id ? api.updateStudent(id, name, group) : api.addStudent(studentId, name, group);
                await action;
                ui.showNotification(id ? '学生信息已更新' : '学生添加成功');
                ui.closeModal(App.dom.studentModal);
                await App.loadData();
            } catch(err) { ui.showNotification(err.message, 'error'); }
        },

        handleGroupFormSubmit: async (e) => {
            e.preventDefault();
            const id = App.dom.groupIdInput.value;
            const name = App.dom.groupNameInput.value.trim();
            if (!name) return ui.showNotification('小组名称不能为空!', 'error');
            try {
                const action = id ? api.updateGroup(id, name) : api.addGroup(name);
                await action;
                ui.showNotification(id ? '小组信息已更新' : '小组添加成功');
                ui.closeModal(App.dom.groupModal);
                await App.loadData();
            } catch(err) { ui.showNotification(err.message, 'error'); }
        },

        handleBulkGroupFormSubmit: async (e) => {
            e.preventDefault();
            const groupId = App.dom.bulkGroupIdInput.value;
            const memberIds = Array.from(App.dom.assignedStudentsList.querySelectorAll('li')).map(li => li.dataset.id);
            try {
                await api.bulkUpdateGroupMembers(groupId, memberIds);
                ui.showNotification('小组成员已更新！');
                ui.closeModal(App.dom.bulkGroupModal);
                await App.loadData();
            } catch(err) { ui.showNotification(err.message, 'error'); }
        },
        
        handlePointsFormSubmit: async (e) => {
            e.preventDefault();
            const studentId = App.dom.pointsStudentIdInput.value;
            const amount = parseInt(App.dom.pointsChangeAmount.value);
            const reason = App.dom.pointsChangeReason.value.trim();
            if (!amount || !reason) return ui.showNotification('请填写有效的分数和原因！', 'error');
            try {
                await api.changePoints(studentId, amount, reason);
                ui.showNotification('积分调整成功');
                ui.closeModal(App.dom.pointsModal);
                await App.loadData();
            } catch(err) { ui.showNotification(err.message, 'error'); }
        },

        handleRewardFormSubmit: async (e) => {
            e.preventDefault();
            const id = App.dom.rewardIdInput.value;
            const name = App.dom.rewardNameInput.value.trim();
            const cost = App.dom.rewardCostInput.value;
            if (!name || !cost || cost < 1) return ui.showNotification('请填写有效的奖品名称和积分！', 'error');
            try {
                const action = id ? api.updateReward(id, name, cost) : api.addReward(name, cost);
                await action;
                ui.showNotification(id ? '奖品信息已更新' : '奖品上架成功');
                ui.closeModal(App.dom.rewardModal);
                await App.loadData();
            } catch (err) { ui.showNotification(err.message, 'error'); }
        },

        handleRedeemFormSubmit: async (e) => {
            e.preventDefault();
            const studentId = App.dom.redeemStudentSelect.value;
            const rewardId = App.dom.redeemRewardIdInput.value;
            if (!studentId) return ui.showNotification('请选择一个学生！', 'error');
            try {
                await api.redeemReward(studentId, rewardId, App.state);
                ui.showNotification('兑换成功！');
                ui.closeModal(App.dom.redeemModal);
                await App.loadData();
            } catch (err) { ui.showNotification(err.message, 'error'); }
        },

        handleGroupPointsFormSubmit: async (e) => {
            e.preventDefault();
            const groupId = App.dom.groupPointsSelect.value;
            const points = parseInt(App.dom.groupPointsAmount.value);
            const reason = App.dom.groupPointsReason.value.trim();
            if (!groupId || !points || !reason) return ui.showNotification('请填写所有有效字段！', 'error');
            try {
                await api.addGroupPoints(groupId, points, reason);
                ui.showNotification('已成功为小组操作积分');
                ui.closeModal(App.dom.groupPointsModal);
                await App.loadData();
            } catch(err) { ui.showNotification(err.message, 'error'); }
        },

        handleAllPointsFormSubmit: async (e) => {
            e.preventDefault();
            const amount = parseInt(App.dom.allPointsAmount.value);
            const reason = App.dom.allPointsReason.value.trim();
            if (!amount || !reason) return ui.showNotification('请填写有效的分数和原因！', 'error');
            try {
                await api.addAllPoints(amount, reason);
                ui.showNotification('已成功为全班成员调整积分');
                ui.closeModal(App.dom.allPointsModal);
                await App.loadData();
            } catch(err) { ui.showNotification(err.message, 'error'); }
        },

        // --- Clicks on Dynamic Content ---
        handleCardClick: (e) => {
            const card = e.target.closest('.student-card');
            if (!card) return;
            const id = card.dataset.id;
            if (e.target.matches('.points-btn')) handlers.openPointsModal(id);
            if (e.target.matches('.record-btn')) handlers.openIndividualRecordModal(id);
            if (e.target.matches('.edit-btn')) handlers.openStudentModal(id);
            if (e.target.matches('.delete-btn')) {
                ui.showConfirm('确认删除此学生吗？', async () => {
                    try {
                        await api.deleteStudent(id);
                        ui.showNotification('学生已删除。');
                        await App.loadData();
                    } catch (err) { ui.showNotification(err.message, 'error'); }
                });
            }
        },

        handleStudentTableClick: (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            const id = row.dataset.id;
            if (e.target.matches('.record-btn')) handlers.openIndividualRecordModal(id);
            if (e.target.matches('.edit-btn')) handlers.openStudentModal(id);
            if (e.target.matches('.delete-btn')) {
                ui.showConfirm('确认删除此学生吗？', async () => {
                    try {
                        await api.deleteStudent(id);
                        ui.showNotification('学生已删除。');
                        await App.loadData();
                    } catch (err) { ui.showNotification(err.message, 'error'); }
                });
            }
        },

        handleGroupTableClick: (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            const id = row.dataset.id;
            if (e.target.matches('.bulk-edit-btn')) handlers.openBulkGroupModal(id);
            if (e.target.matches('.edit-btn')) handlers.openGroupModal(id);
            if (e.target.matches('.delete-btn')) {
                 ui.showConfirm('删除小组会将该小组学生置为未分组，确认删除？', async () => {
                    try {
                        await api.deleteGroup(id);
                        ui.showNotification('小组已删除。');
                        await App.loadData();
                    } catch (err) { ui.showNotification(err.message, 'error'); }
                });
            }
        },

        handleRewardCardClick: (e) => {
            const card = e.target.closest('.reward-card');
            if (!card) return;
            const id = card.dataset.id;
            if (e.target.matches('.redeem-btn')) handlers.openRedeemModal(id);
            if (e.target.matches('.edit-btn')) handlers.openRewardModal(id);
            if (e.target.matches('.delete-btn')) {
                ui.showConfirm('确认删除此奖品吗？', async () => {
                    try {
                        await api.deleteReward(id);
                        ui.showNotification('奖品已删除');
                        await App.loadData();
                    } catch(err) { ui.showNotification(err.message, 'error'); }
                });
            }
        },
        
        handleStudentListItemClick: (e, type) => {
            if (e.target.tagName !== 'LI') return;
            const targetList = type === 'unassigned' ? App.dom.assignedStudentsList : App.dom.unassignedStudentsList;
            targetList.appendChild(e.target);
        },
        
        // --- Turntable Logic ---
        handleTurntablePrizeFormSubmit: async (e) => {
            e.preventDefault();
            const id = App.dom.turntablePrizeIdInput.value;
            const name = App.dom.turntablePrizeNameInput.value.trim();
            if (!name) return ui.showNotification('请输入奖品名称！', 'error');
            try {
                const action = id ? api.updateTurntablePrize(id, name) : api.addTurntablePrize(name);
                await action;
                ui.closeModal(App.dom.turntablePrizeModal);
                await App.loadData();
                handlers.initTurntable();
                ui.showNotification('转盘奖品已更新');
            } catch(err) { ui.showNotification(err.message, 'error'); }
        },

        handleTurntablePrizeTableClick: (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            const prizeId = row.dataset.id;
            if (e.target.matches('.edit-btn')) handlers.openTurntablePrizeModal(prizeId);
            if (e.target.matches('.delete-btn')) {
                ui.showConfirm('确认删除此奖品吗？', async () => {
                    try {
                        await api.deleteTurntablePrize(prizeId);
                        await App.loadData();
                        handlers.initTurntable();
                        ui.showNotification('奖品已删除。');
                    } catch (err) { ui.showNotification(err.message, 'error'); }
                });
            }
        },

        handleSpinSelectFormSubmit: async (e) => {
            e.preventDefault();
            const studentId = App.dom.spinStudentSelect.value;
            if (!studentId) return ui.showNotification('请选择一位学生！', 'error');
            try {
                App.status.currentSpinnerId = studentId;
                await api.changePoints(studentId, -App.state.turntableCost, '幸运大转盘抽奖');
                ui.closeModal(App.dom.spinSelectModal);
                await App.loadData();
                if (App.status.turntableInstance) {
                    App.status.turntableInstance.stopAnimation(false);
                    App.status.turntableInstance.rotationAngle = 0;
                    App.status.turntableInstance.draw();
                    App.status.turntableInstance.startAnimation();
                }
            } catch(err) {
                ui.showNotification(err.message, 'error');
                App.status.currentSpinnerId = null;
            }
        },

        spinFinished: async (indicatedSegment) => {
            const sId = App.status.currentSpinnerId;
            if (!sId) return;
            const student = App.state.students.find(s => s.id === sId);
            if(student) ui.showNotification(`${student.name} 抽中了: ${indicatedSegment.text}`);
            if (indicatedSegment.text.includes('+')) {
                const points = parseInt(indicatedSegment.text);
                if (!isNaN(points) && points > 0) {
                    try {
                        await api.changePoints(sId, points, `幸运转盘: ${indicatedSegment.text}`);
                        await App.loadData();
                    } catch (err) { ui.showNotification(err.message, 'error'); }
                }
            }
            App.status.currentSpinnerId = null;
        },

initTurntable: () => {
            if (!App.dom.turntableCanvas) return;
            // 1. 如果旧实例存在，先停止动画
            if (App.status.turntableInstance) {
                App.status.turntableInstance.stopAnimation(false);
            }
            // 2. 强制清空画布，这是解决 'kill' 错误和重绘问题的关键
            const canvas = App.dom.turntableCanvas;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 3. 将旧实例引用设为null
            App.status.turntableInstance = null;
        
            const prizes = App.state.turntablePrizes.length > 0 ? App.state.turntablePrizes.map(p => ({text: p.text})) : [{ text: '谢谢参与' }];
            const colors = ["#8C236E", "#2C638C", "#3C8C4D", "#D99E3D", "#D9523D", "#8C2323", "#45238C", "#238C80"];
            
            App.status.turntableInstance = new Winwheel({
                'canvasId': 'turntable-canvas', 
                'numSegments': prizes.length, 
                'responsive': true,
                'segments': prizes.map((p, i) => ({ ...p, fillStyle: colors[i % colors.length], textFillStyle: '#ffffff' })),
                'animation': { 
                    'type': 'spinToStop', 
                    'duration': 8, 
                    'spins': 10, 
                    'callbackFinished': handlers.spinFinished 
                }
            });
        },

        // --- Modal Opening Handlers ---
        openStudentModal: (id = null) => {
            App.dom.studentForm.reset();
            App.dom.studentIdInput.value = id || '';
            const select = App.dom.studentGroupSelect;
            select.innerHTML = '<option value="">未分组</option>';
            App.state.groups.forEach(g => {
                const o = document.createElement('option');
                o.value = g.id; o.text = g.name; select.add(o)
            });
            const idDisplayInput = App.dom.studentIdDisplayInput;
            if (id) {
                const student = App.state.students.find(st => st.id === id);
                idDisplayInput.value = student.id; idDisplayInput.readOnly = true;
                App.dom.studentNameInput.value = student.name;
                select.value = student.group;
                App.dom.studentModalTitle.innerText = '编辑学生';
            } else {
                idDisplayInput.value = ''; idDisplayInput.readOnly = false;
                App.dom.studentModalTitle.innerText = '新增学生';
            }
            ui.openModal(App.dom.studentModal);
        },
        openGroupModal: (id = null) => {
            App.dom.groupForm.reset();
            App.dom.groupIdInput.value = id || '';
            const title = App.dom.groupModal.querySelector('h2');
            if (id) {
                const group = App.state.groups.find(gr => gr.id === id);
                App.dom.groupNameInput.value = group.name;
                title.innerText = '编辑小组';
            } else {
                title.innerText = '新增小组';
            }
            ui.openModal(App.dom.groupModal);
        },
        openBulkGroupModal: (groupId) => {
            const group = App.state.groups.find(g => g.id === groupId);
            if (!group) return;
            App.dom.bulkGroupName.innerText = group.name;
            App.dom.bulkGroupIdInput.value = group.id;
            App.render.bulkGroupEditor(groupId);
            ui.openModal(App.dom.bulkGroupModal);
        },
        openRewardModal: (id = null) => {
            App.dom.rewardForm.reset();
            App.dom.rewardIdInput.value = id || '';
            if (id) {
                const r = App.state.rewards.find(r => r.id === id);
                App.dom.rewardModalTitle.innerText = '编辑奖品';
                App.dom.rewardNameInput.value = r.name;
                App.dom.rewardCostInput.value = r.cost;
            } else {
                App.dom.rewardModalTitle.innerText = '上架新奖品';
            }
            ui.openModal(App.dom.rewardModal);
        },
        openRedeemModal: (rewardId) => {
            const reward = App.state.rewards.find(r => r.id === rewardId);
            if (!reward) return;
            App.dom.redeemRewardIdInput.value = rewardId;
            App.dom.redeemRewardName.innerText = reward.name;
            App.dom.redeemRewardCost.innerText = reward.cost;
            const select = App.dom.redeemStudentSelect;
            select.innerHTML = '<option value="">-- 选择学生 --</option>';
            App.state.students.filter(st => st.points >= reward.cost).forEach(st => {
                const o = document.createElement('option');
                o.value = st.id;
                o.innerText = `${st.name} (当前 ${st.points} 积分)`;
                select.add(o);
            });
            ui.openModal(App.dom.redeemModal);
        },
        openGroupPointsModal: () => {
            App.dom.groupPointsForm.reset();
            const select = App.dom.groupPointsSelect;
            select.innerHTML = '<option value="">-- 请选择一个小组 --</option>';
            App.state.groups.forEach(g => {
                const o = document.createElement('option');
                o.value = g.id; o.innerText = g.name; select.add(o);
            });
            ui.openModal(App.dom.groupPointsModal);
        },
        openPointsModal: (studentId) => {
            const student = App.state.students.find(s => s.id === studentId);
            if (!student) return;
            App.dom.pointsForm.reset();
            App.dom.pointsStudentName.innerText = student.name;
            App.dom.pointsStudentIdInput.value = studentId;
            ui.openModal(App.dom.pointsModal);
            App.dom.pointsChangeAmount.focus();
        },
        openAllPointsModal: () => {
            App.dom.allPointsForm.reset();
            ui.openModal(App.dom.allPointsModal);
        },
        openTurntablePrizeModal: (id = null) => {
            App.dom.turntablePrizeForm.reset();
            App.dom.turntablePrizeIdInput.value = id || '';
            if (id) {
                const p = App.state.turntablePrizes.find(p => p.id === id);
                App.dom.turntablePrizeNameInput.value = p.text;
                App.dom.turntablePrizeModalTitle.innerText = '编辑奖品';
            } else {
                App.dom.turntablePrizeModalTitle.innerText = '新增奖品';
            }
            ui.openModal(App.dom.turntablePrizeModal);
        },
        openSpinSelectModal: () => {
            if (App.status.turntableInstance && App.status.turntableInstance.isSpinning) return;
            if (App.state.turntablePrizes.length === 0) return ui.showNotification('请先在右侧添加奖品！', 'error');
            App.dom.spinCostDisplay.innerText = App.state.turntableCost;
            const select = App.dom.spinStudentSelect;
            select.innerHTML = '<option value="">-- 选择学生 --</option>';
            App.state.students.filter(st => st.points >= App.state.turntableCost).forEach(st => {
                const o = document.createElement('option');
                o.value = st.id;
                o.innerText = `${st.name} (当前 ${st.points} 积分)`;
                select.add(o);
            });
            ui.openModal(App.dom.spinSelectModal);
        },
        openIndividualRecordModal(studentId) {
            const student = App.state.students.find(s => s.id === studentId);
            if (!student) return ui.showNotification('找不到该学生的信息。', 'error');
            App.dom.individualRecordModalTitle.innerText = `【${student.name}】的积分记录`;
            App.render.individualRecords(studentId); // This still calls a render function directly, which is fine for modals
            ui.openModal(App.dom.individualRecordModal);
        },
    };
    
    return handlers;
}