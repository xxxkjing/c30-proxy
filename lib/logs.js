// lib/logs.js

let logs = [];

function addLog(entry) {
  logs.push(entry);
  // 限制日志条数，保存最新 100 条
  if (logs.length > 100) {
    logs.shift();
  }
}

function getLogs() {
  return logs;
}

export { addLog, getLogs };
