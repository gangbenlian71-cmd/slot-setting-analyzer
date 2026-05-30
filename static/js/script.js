/**
 * ユーティリティ関数
 */

// APIリクエスト
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(endpoint, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'API error');
        }

        return result;
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

// ステータスメッセージの表示
function showStatusMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `status-message show ${type}`;
    }
}

// ステータスメッセージの非表示
function hideStatusMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.className = 'status-message';
    }
}

// ローディングスピナーの作成
function createSpinner() {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    return spinner;
}

// フォーマット関数
function formatPercentage(value) {
    return (value * 100).toFixed(1) + '%';
}

function formatRatio(value) {
    return '1/' + Math.round(value);
}
