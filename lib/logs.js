// lib/logs.js

let logs = [];

function addLog(entry) {
  logs.push(entry);
  // 控制日志数量最多保持100条记录
  if (logs.length > 100) {
    logs.shift();
  }
}

function getLogs() {
  return logs;
}

export { addLog, getLogs };
