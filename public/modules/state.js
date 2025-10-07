// public/modules/state.js
export const state = {
    students: [],
    groups: [],
    rewards: [],
    records: [],
    sortState: { column: 'id', direction: 'asc' },
    leaderboardType: 'realtime',
    turntablePrizes: [],
    turntableCost: 10,
    dashboardSortState: { column: 'points', direction: 'desc' },
};

export const appStatus = {
    turntableInstance: null,
    currentSpinnerId: null,
};