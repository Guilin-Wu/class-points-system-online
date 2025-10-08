// public/modules/api.js

/**
 * 统一的 API 请求函数
 * @param {string} endpoint - API 路径 (例如 '/students')
 * @param {object} options - fetch API 的配置对象 (例如 { method: 'POST', body: ... })
 * @returns {Promise<any>} - 返回后端响应的 JSON 数据
 */
async function fetchApi(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`/api${endpoint}`, { ...options, headers });

        // 如果 token 无效或过期，后端会返回 401 或 403
        if (response.status === 401 || response.status === 403) {
            // 清除无效的 token 并强制刷新页面，回到登录页
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            location.reload();
            // 抛出错误以停止后续代码执行
            throw new Error('认证失败或已过期，请重新登录。');
        }
        
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};

        if (!response.ok) {
            throw new Error(data.error || '服务器请求失败');
        }
        
        return data; // 成功时返回解析后的数据
    } catch (error) {
        console.error(`API Error on ${options.method || 'GET'} ${endpoint}:`, error);
        // 将错误继续向上抛出，以便调用者可以处理
        throw error;
    }
}

export async function getAllData() {
    return fetchApi('/data');
}
// --- Authentication ---
export async function login(email, password) {
    const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    return data;
}

export function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    location.reload();
}

export async function register(email, password) {
    return await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

// --- Students ---
export const addStudent = (id, name, group) => fetchApi('/students', { method: 'POST', body: JSON.stringify({ id, name, group }) });
export const updateStudent = (id, name, group) => fetchApi(`/students/${id}`, { method: 'PUT', body: JSON.stringify({ name, group }) });
export const deleteStudent = (id) => fetchApi(`/students/${id}`, { method: 'DELETE' });

// --- Points ---
export const changePoints = (studentId, delta, reason) => fetchApi(`/students/${studentId}/points`, { method: 'POST', body: JSON.stringify({ delta, reason }) });

// --- Groups ---
export const addGroup = (name) => fetchApi('/groups', { method: 'POST', body: JSON.stringify({ name }) });
export const updateGroup = (id, name) => fetchApi(`/groups/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteGroup = (id) => fetchApi(`/groups/${id}`, { method: 'DELETE' });
export const bulkUpdateGroupMembers = (groupId, memberIds) => fetchApi(`/groups/${groupId}/members`, { method: 'PUT', body: JSON.stringify({ memberIds }) });

// --- Bulk Points ---
export const addGroupPoints = (groupId, pointsDelta, reason) => fetchApi(`/groups/${groupId}/points`, { method: 'POST', body: JSON.stringify({ pointsDelta, reason }) });
export const addAllPoints = (pointsDelta, reason) => fetchApi(`/class/points`, { method: 'POST', body: JSON.stringify({ pointsDelta, reason }) });

// --- Rewards Store ---
export const addReward = (name, cost) => fetchApi('/rewards', { method: 'POST', body: JSON.stringify({ name, cost: parseInt(cost) }) });
export const updateReward = (id, name, cost) => fetchApi(`/rewards/${id}`, { method: 'PUT', body: JSON.stringify({ name, cost: parseInt(cost) }) });
export const deleteReward = (id) => fetchApi(`/rewards/${id}`, { method: 'DELETE' });

/**
 * 兑换奖品是一个特殊的 action，它包含前端逻辑检查
 * @param {string} studentId - 学生ID
 * @param {string} rewardId - 奖品ID
 * @param {object} currentState - 当前的应用状态，用于前端检查
 */
export async function redeemReward(studentId, rewardId, currentState) {
    const reward = currentState.rewards.find(r => r.id === rewardId);
    if (!reward) throw new Error("未找到指定的奖品");

    const student = currentState.students.find(s => s.id === studentId);
    if (!student) throw new Error("未找到指定的学生");

    if (student.points < reward.cost) {
        throw new Error("学生积分不足，无法兑换");
    }

    // 前端检查通过后，调用后端的积分变更接口
    return changePoints(studentId, -reward.cost, `兑换: ${reward.name}`);
}

// --- Turntable ---
export const addTurntablePrize = (name) => fetchApi('/turntable/prizes', { method: 'POST', body: JSON.stringify({ text: name }) });
export const updateTurntablePrize = (id, name) => fetchApi(`/turntable/prizes/${id}`, { method: 'PUT', body: JSON.stringify({ text: name }) });
export const deleteTurntablePrize = (id) => fetchApi(`/turntable/prizes/${id}`, { method: 'DELETE' });
export const updateTurntableCost = (cost) => fetchApi('/settings/turntableCost', { method: 'PUT', body: JSON.stringify({ cost }) });

// --- Data Management ---
export const clearAllData = () => fetchApi('/data', { method: 'DELETE' });

export const clearPointsData = () => fetchApi('/data/points', { method: 'DELETE' });
export const importJsonData = (data) => fetchApi('/data/import', { method: 'POST', body: JSON.stringify(data) });
// ...
//export const importJsonData = (data) => fetchApi('/data/import', { method: 'POST', body: JSON.stringify(data) });
export const importStudentsFromExcel = (students) => fetchApi('/students/import', { method: 'POST', body: JSON.stringify(students) });