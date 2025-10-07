// public/modules/print.js

// 使用工厂模式，传入 App 实例以访问 state, ui, dom
export function createPrint(App) {

    // 内部函数，负责打开新窗口并执行打印
    const _printContent = (title, content) => {
        const printWindow = window.open('', '_blank', 'height=600,width=800');
        printWindow.document.write(`
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: 'Noto Sans SC', sans-serif; margin: 20px; }
                    h1, h2 { text-align: center; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                ${content}
                <script>
                  setTimeout(function() {
                    window.print();
                    window.close();
                  }, 250);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const printObject = {
        // 打印全体学生积分总览
        summary: () => {
            const title = '全体学生积分总览';
            const date = new Date().toLocaleString('zh-CN');
            let tableHTML = `
                <h1>${title}</h1>
                <h2>打印时间: ${date}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>学生ID</th>
                            <th>姓名</th>
                            <th>实时积分</th>
                            <th>累计积分</th>
                            <th>扣分积分</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            App.state.students.forEach(s => {
                tableHTML += `
                    <tr>
                        <td>${s.id}</td>
                        <td>${s.name}</td>
                        <td>${s.points || 0}</td>
                        <td>${s.totalearnedpoints || 0}</td>
                        <td>${s.totaldeductions || 0}</td>
                    </tr>
                `;
            });
            tableHTML += '</tbody></table>';
            _printContent(title, tableHTML);
        },

        // 打印单个学生积分明细
        details: () => {
            const studentId = App.dom.printStudentSelect.value;
            if (!studentId) {
                return App.ui.showNotification('请先选择一个学生！', 'error');
            }

            const student = App.state.students.find(s => s.id === studentId);
            const records = App.state.records.filter(r => r.studentid === studentId);
            const title = `“${student.name}”的积分明细`;
            const date = new Date().toLocaleString('zh-CN');

            let tableHTML = `<h1>${title}</h1><h2>打印时间: ${date}</h2>`;

            if (records.length === 0) {
                tableHTML += '<p style="text-align:center;">该学生暂无积分记录。</p>';
            } else {
                tableHTML += `
                    <table>
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>分值变化</th>
                                <th>原因</th>
                                <th>最终积分</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                records.forEach(r => { // records from backend are already sorted DESC
                    tableHTML += `
                        <tr>
                            <td>${r.time}</td>
                            <td>${r.change}</td>
                            <td>${r.reason}</td>
                            <td>${r.finalpoints}</td>
                        </tr>
                    `;
                });
                tableHTML += '</tbody></table>';
            }
            _printContent(title, tableHTML);
        }
    };
    
    return printObject;
}