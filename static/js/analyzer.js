/**
 * アナライザーアプリケーション
 */

class SlotAnalyzer {
    constructor() {
        this.machineData = null;
        this.machineName = null;
        this.machines = [];
        this.machineCount = 0;
        this.init();
    }

    init() {
        // イベントリスナー設定
        document.getElementById('search_btn').addEventListener('click', () => this.searchMachine());
        document.getElementById('add_machine_btn').addEventListener('click', () => this.addMachineInput());
        document.getElementById('analyze_btn').addEventListener('click', () => this.analyze());
        document.getElementById('reset_btn').addEventListener('click', () => this.reset());

        // Enterキーでも検索できるようにする
        document.getElementById('machine_name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchMachine();
            }
        });
    }

    async searchMachine() {
        const machineName = document.getElementById('machine_name').value.trim();
        
        if (!machineName) {
            showStatusMessage('search_status', '機種名を入力してください', 'error');
            return;
        }

        const btn = document.getElementById('search_btn');
        btn.disabled = true;
        showStatusMessage('search_status', '検索中...', 'loading');

        try {
            const response = await apiRequest('/api/search_machine', 'POST', {
                machine_name: machineName
            });

            if (response.success) {
                this.machineData = response.machine_data;
                this.machineName = response.machine_name;
                this.showStep2();
                hideStatusMessage('search_status');
                showStatusMessage('search_status', `${this.machineName} を検索しました`, 'success');
            } else {
                showStatusMessage('search_status', response.error || 'エラーが発生しました', 'error');
            }
        } catch (error) {
            showStatusMessage('search_status', error.message || 'エラーが発生しました', 'error');
        } finally {
            btn.disabled = false;
        }
    }

    showStep2() {
        // ステップ1を非表示、ステップ2を表示
        document.querySelector('.step-1').style.display = 'block';
        document.querySelector('.step-2').style.display = 'block';

        // 機種情報を表示
        const machineInfo = document.getElementById('machine_info');
        machineInfo.textContent = `選択中: ${this.machineName}`;

        // 最初の台入力フォームを追加
        this.machineCount = 0;
        this.machines = [];
        document.getElementById('machines_container').innerHTML = '';
        this.addMachineInput();
    }

    addMachineInput() {
        const container = document.getElementById('machines_container');
        const index = this.machines.length;
        const machineId = index + 1;

        const machineInputHTML = `
            <div class="machine-input" data-index="${index}">
                <div class="machine-input-header">
                    <div class="machine-input-title">台番号 ${machineId}</div>
                    ${index > 0 ? `<button class="btn btn-remove" onclick="analyzer.removeMachineInput(${index})">削除</button>` : ''}
                </div>
                <div class="machine-input-grid">
                    <div class="form-group">
                        <label for="machine_id_${index}">台番号:</label>
                        <input 
                            type="number" 
                            id="machine_id_${index}" 
                            placeholder="例: 123"
                            class="form-input"
                            value="${machineId}"
                        >
                    </div>
                    <div class="form-group">
                        <label for="bonus_rate_${index}">ボーナス出現率 (1/X):</label>
                        <input 
                            type="number" 
                            id="bonus_rate_${index}" 
                            placeholder="例: 150"
                            class="form-input"
                            step="0.1"
                        >
                    </div>
                    <div class="form-group">
                        <label for="small_win_rate_${index}">小役確率 (1/X):</label>
                        <input 
                            type="number" 
                            id="small_win_rate_${index}" 
                            placeholder="例: 50"
                            class="form-input"
                            step="0.1"
                        >
                    </div>
                    <div class="form-group">
                        <label for="total_rate_${index}">合算確率 (1/X):</label>
                        <input 
                            type="number" 
                            id="total_rate_${index}" 
                            placeholder="例: 100"
                            class="form-input"
                            step="0.1"
                        >
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', machineInputHTML);
        this.machines.push({
            index: index
        });
    }

    removeMachineInput(index) {
        const element = document.querySelector(`[data-index="${index}"]`);
        if (element) {
            element.remove();
            this.machines = this.machines.filter((m, i) => i !== index);
        }
    }

    getMachineInputData() {
        const machines = [];
        const inputs = document.querySelectorAll('.machine-input');

        inputs.forEach((input, index) => {
            const machineId = parseInt(document.getElementById(`machine_id_${index}`).value) || index + 1;
            const bonusRate = parseFloat(document.getElementById(`bonus_rate_${index}`).value);
            const smallWinRate = parseFloat(document.getElementById(`small_win_rate_${index}`).value);
            const totalRate = parseFloat(document.getElementById(`total_rate_${index}`).value);

            if (bonusRate && smallWinRate) {
                machines.push({
                    machine_id: machineId,
                    bonus_rate: bonusRate,
                    small_win_rate: smallWinRate,
                    total_rate: totalRate || null
                });
            }
        });

        return machines;
    }

    async analyze() {
        const machines = this.getMachineInputData();

        if (machines.length === 0) {
            alert('最低1台以上、ボーナス出現率と小役確率を入力してください');
            return;
        }

        const btn = document.getElementById('analyze_btn');
        btn.disabled = true;

        try {
            const response = await apiRequest('/api/analyze', 'POST', {
                machine_name: this.machineName,
                machine_data: this.machineData,
                machines: machines
            });

            if (response.success) {
                this.showResults(response.analysis);
            } else {
                alert(response.error || 'エラーが発生しました');
            }
        } catch (error) {
            alert(error.message || 'エラーが発生しました');
        } finally {
            btn.disabled = false;
        }
    }

    showResults(analysisResult) {
        // ステップ3を表示
        document.querySelector('.step-3').style.display = 'block';

        // 結果を表示
        const container = document.getElementById('results_container');
        let resultsHTML = '';

        analysisResult.analysis.forEach(result => {
            const machineId = result.machine_id;
            const setting = result.estimated_setting;
            const confidence = result.confidence;
            const probabilities = result.probability_by_setting;

            const confidencePercent = (confidence * 100).toFixed(1);

            let probTableRows = '';
            for (let s = 1; s <= 6; s++) {
                const prob = probabilities[`setting_${s}`] || 0;
                const probPercent = (prob * 100).toFixed(1);
                const isEstimated = s === setting ? 'style="font-weight: bold; color: var(--color-primary);"' : '';
                probTableRows += `
                    <tr ${isEstimated}>
                        <td>設定 ${s}</td>
                        <td>${probPercent}%</td>
                    </tr>
                `;
            }

            resultsHTML += `
                <div class="result-card">
                    <div class="result-machine-id">台番号: ${machineId}</div>
                    <div class="result-setting">
                        推測設定: <span style="color: var(--color-primary);">${setting}</span>
                    </div>
                    <div>信頼度: ${confidencePercent}%</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidencePercent}%;">
                            ${confidencePercent}%
                        </div>
                    </div>
                    <table class="probability-table">
                        <thead>
                            <tr>
                                <th>設定</th>
                                <th>確率</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${probTableRows}
                        </tbody>
                    </table>
                </div>
            `;
        });

        container.innerHTML = resultsHTML;

        // ページをスクロール
        document.querySelector('.step-3').scrollIntoView({ behavior: 'smooth' });
    }

    reset() {
        // 全ステップを非表示
        document.querySelector('.step-1').style.display = 'block';
        document.querySelector('.step-2').style.display = 'none';
        document.querySelector('.step-3').style.display = 'none';

        // フォームをリセット
        document.getElementById('machine_name').value = '';
        document.getElementById('machines_container').innerHTML = '';
        document.getElementById('results_container').innerHTML = '';

        // 状態をリセット
        this.machineData = null;
        this.machineName = null;
        this.machines = [];

        // ページをトップにスクロール
        document.querySelector('.step-1').scrollIntoView({ behavior: 'smooth' });
    }
}

// グローバルインスタンス
let analyzer;

// DOMLoaded後に初期化
document.addEventListener('DOMContentLoaded', () => {
    analyzer = new SlotAnalyzer();
});
