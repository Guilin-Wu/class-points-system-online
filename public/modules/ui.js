// public/modules/ui.js

import { DOMElements } from './dom.js';

/**
 * 在屏幕右上角显示一个通知
 * @param {string} message - 要显示的消息
 * @param {string} type - 通知类型 ('success' 或 'error')
 */
export function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    DOMElements.notificationContainer.appendChild(notif);
    setTimeout(() => {
        notif.classList.add('fade-out');
        notif.addEventListener('animationend', () => notif.remove());
    }, 3000);
}

/**
 * 显示一个确认对话框
 * @param {string} message - 提示用户的消息
 * @param {function} onConfirm - 用户点击“确认”后要执行的回调函数
 */
export function showConfirm(message, onConfirm) {
    // 使用 DOMElements 中缓存的元素引用
    const { confirmModal, confirmModalText, confirmOkBtn, confirmCancelBtn, confirmCloseBtn } = DOMElements;
    
    confirmModalText.textContent = message;
    confirmModal.classList.add('active');

    // 通过克隆按钮来移除旧的事件监听器，确保 onConfirm 不会重复绑定
    const newOkBtn = confirmOkBtn.cloneNode(true);
    confirmOkBtn.parentNode.replaceChild(newOkBtn, confirmOkBtn);
    
    // 更新 DOMElements 中的引用（虽然在这个模块不强制，但是好习惯）
    DOMElements.confirmOkBtn = newOkBtn;

    const closeModal = () => confirmModal.classList.remove('active');

    newOkBtn.onclick = () => {
        closeModal();
        onConfirm(); // 执行传入的回调
    };
    confirmCancelBtn.onclick = closeModal;
    confirmCloseBtn.onclick = closeModal;
}

/**
 * 打开一个弹窗
 * @param {HTMLElement} modalElement - 要打开的弹窗元素
 */
export function openModal(modalElement) {
    if (modalElement) {
        modalElement.classList.add('active');
    }
}

/**
 * 关闭一个弹窗
 * @param {HTMLElement} modalElement - 要关闭的弹窗元素
 */
export function closeModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('active');
    }
}

/**
 * 根据累计积分获取成就等级和样式名
 * @param {number} totalEarnedPoints - 学生的累计获得积分
 * @returns {object|null} - 包含成就标题和类名的对象，或在没有成就时返回 null
 */
export function getAchievement(totalEarnedPoints) {
    if (totalEarnedPoints >= 1000) return { title: '积分战神', className: 'tier-god' };
    if (totalEarnedPoints >= 500) return { title: '积分王者', className: 'tier-king' };
    if (totalEarnedPoints >= 200) return { title: '积分大师', className: 'tier-master' };
    if (totalEarnedPoints >= 100) return { title: '积分达人', className: 'tier-expert' };
    if (totalEarnedPoints >= 50) return { title: '积分新秀', className: 'tier-rookie' };
    return null;
}