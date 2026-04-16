// ==========================================
// 1. HTMLの部品（要素）を取得する
// ==========================================
const idInput = document.getElementById('m-userId');
const nameInput = document.getElementById('m-userName');
const placeInput = document.getElementById('m-userPlace');
const infoInput = document.getElementById('m-userInfo');
const saveBtn = document.getElementById('modal-save-btn');
const userList = document.getElementById('user-list');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort-select'); // 🌟 並び替えメニューを取得
const modalTitle = document.getElementById('modal-title');

let currentEditingId = null;

// ==========================================
// 2. ページ読み込み時と、並び替えメニュー操作時の処理
// ==========================================
document.addEventListener('DOMContentLoaded', displayUsers);
sortSelect.addEventListener('change', displayUsers); // 🌟 メニューを変えたら画面を更新！

// ==========================================
// 3. データの表示・並べ替え機能
// ==========================================
function displayUsers() {
    userList.innerHTML = '';
    let users = JSON.parse(localStorage.getItem('myUsers')) || [];

    // 🌟 並べ替えロジック
    const sortValue = sortSelect.value;
    if (sortValue !== 'none') {
        users.sort((a, b) => {
            if (sortValue === 'id-asc') return Number(a.id) - Number(b.id);
            if (sortValue === 'name-asc') return a.name.localeCompare(b.name, 'ja');
            if (sortValue === 'place-asc') return a.place.localeCompare(b.place, 'ja');
            return 0;
        });
    }

    users.forEach(addUserToTable);
}

// 表に1行追加する処理
function addUserToTable(user) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.place}</td>
        <td title="${user.info}">${user.info}</td>
        <td>
            <div class="btn-group">
                <button class="detail-btn" onclick="openModalForEdit('${user.id}')">詳細</button>
                <button class="delete-btn" onclick="deleteUser('${user.id}')">削除</button>
            </div>
        </td>
    `;
    userList.appendChild(tr);
}

// ==========================================
// 4. モーダル（詳細画面）の開閉機能
// ==========================================
function openModalForAdd() {
    currentEditingId = null;
    modalTitle.textContent = "新規ユーザー登録";
    idInput.disabled = false;
    [idInput, nameInput, placeInput, infoInput].forEach(el => el.value = '');
    document.getElementById('user-modal').style.display = 'block';
}

function openModalForEdit(id) {
    const users = JSON.parse(localStorage.getItem('myUsers')) || [];
    const user = users.find(u => u.id === id);
    if (!user) return;

    currentEditingId = id;
    modalTitle.textContent = "ユーザー情報の編集";
    idInput.value = user.id;
    idInput.disabled = true;
    nameInput.value = user.name;
    placeInput.value = user.place;
    infoInput.value = user.info;

    document.getElementById('user-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('user-modal').style.display = 'none';
}

// ==========================================
// 5. データの保存機能
// ==========================================
saveBtn.addEventListener('click', () => {
    const user = { id: idInput.value, name: nameInput.value, place: placeInput.value, info: infoInput.value };
    if (!user.id || !user.name) return alert('IDと名前は必須です');

    let users = JSON.parse(localStorage.getItem('myUsers')) || [];

    if (currentEditingId) {
        users = users.map(u => u.id === currentEditingId ? user : u);
    } else {
        if (users.some(u => u.id === user.id)) return alert('そのIDは既に存在します');
        users.push(user);
    }

    localStorage.setItem('myUsers', JSON.stringify(users));
    closeModal();
    displayUsers();
});

// ==========================================
// 6. データの削除機能
// ==========================================
function deleteUser(id) {
    if(!confirm('本当に削除しますか？')) return;
    let users = JSON.parse(localStorage.getItem('myUsers')) || [];
    users = users.filter(u => u.id !== id);
    localStorage.setItem('myUsers', JSON.stringify(users));
    displayUsers();
}

// ==========================================
// 7. 検索機能
// ==========================================
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    let users = JSON.parse(localStorage.getItem('myUsers')) || [];

    // 検索中も並べ替えを維持する
    const sortValue = sortSelect.value;
    if (sortValue !== 'none') {
        users.sort((a, b) => {
            if (sortValue === 'id-asc') return Number(a.id) - Number(b.id);
            if (sortValue === 'name-asc') return a.name.localeCompare(b.name, 'ja');
            if (sortValue === 'place-asc') return a.place.localeCompare(b.place, 'ja');
            return 0;
        });
    }

    userList.innerHTML = '';
    users.filter(u => Object.values(u).some(v => v.toLowerCase().includes(query)))
         .forEach(addUserToTable);
});

// ==========================================
// 8. データのお引っ越し（バックアップ）機能
// ==========================================

// データの書き出し (Export)
function exportData() {
    const data = localStorage.getItem('myUsers') || '[]';
    // データをファイル（Blob）に変換
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 見えないリンクを作って自動でクリックさせる（ダウンロード発動）
    const a = document.createElement('a');
    a.href = url;
    a.download = 'myUsers_backup.json'; // 保存されるファイル名
    a.click();
    
    URL.revokeObjectURL(url); // お掃除
}

// データの読み込み (Import)
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // ファイルの中身を読み取って、金庫（localStorage）に上書きする
            const data = JSON.parse(e.target.result);
            localStorage.setItem('myUsers', JSON.stringify(data));
            displayUsers(); // 画面を更新
            alert('データの読み込みに成功しました！');
        } catch (error) {
            alert('ファイルの読み込みに失敗しました。');
        }
    };
    reader.readAsText(file);
}

// 背景クリックでモーダルを閉じる
window.onclick = (e) => { if(e.target.className === 'modal-overlay') closeModal(); }