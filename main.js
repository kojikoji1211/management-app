// ==========================================
// 1. HTMLの部品を取得する
// ==========================================
const facilityView = document.getElementById('facility-view');
const residentView = document.getElementById('resident-view');
const currentFacilityName = document.getElementById('current-facility-name');

const idInput = document.getElementById('m-userId');
const nameInput = document.getElementById('m-userName');
const placeInput = document.getElementById('m-userPlace');
const dobInput = document.getElementById('m-userDob');
const moveInInput = document.getElementById('m-userMoveIn');
const infoInput = document.getElementById('m-userInfo');

const saveBtn = document.getElementById('modal-save-btn');
const userList = document.getElementById('user-list');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort-select');
const modalTitle = document.getElementById('modal-title');

let currentEditingId = null;

// ==========================================
// 2. ページ読み込み時の初期化
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initFacilities();
    displayFacilities();
    // 起動時に施設一覧が出るように明示
    showFacilityView();
});

if (sortSelect) {
    sortSelect.addEventListener('change', displayUsers);
}

// ==========================================
// 3. 画面の切り替え（SPA）
// ==========================================
function showFacilityView() {
    facilityView.style.display = 'block';
    residentView.style.display = 'none';
    displayFacilities(); // 戻った時に人数などを再計算
}

function showResidentView(facilityName) {
    currentFacilityName.textContent = facilityName;
    facilityView.style.display = 'none';
    residentView.style.display = 'block';
    
    if (searchInput) searchInput.value = ''; 
    if (sortSelect) sortSelect.value = 'none';
    displayUsers();
}

// ==========================================
// 4. 施設の管理機能
// ==========================================
function initFacilities() {
    if (!localStorage.getItem('myFacilities')) {
        const defaultFacilities = [
            { id: 'fac-1', name: 'さくら苑' },
            { id: 'fac-2', name: 'ひまわり館' }
        ];
        localStorage.setItem('myFacilities', JSON.stringify(defaultFacilities));
    }
}

function displayFacilities() {
    const facilityList = document.getElementById('facility-list');
    if (!facilityList) return;
    facilityList.innerHTML = '';
    
    const facilities = JSON.parse(localStorage.getItem('myFacilities')) || [];
    const allUsers = JSON.parse(localStorage.getItem('myUsers')) || [];

    facilities.forEach(fac => {
        const card = document.createElement('div');
        card.className = 'facility-card';
        card.onclick = () => showResidentView(fac.name);

        const residentCount = allUsers.filter(u => u.place === fac.name).length;

        card.innerHTML = `
            <h3>🏢 ${fac.name}</h3>
            <p style="color: #666; font-weight: bold;">入居者: ${residentCount} 名</p>
            <button class="delete-btn" onclick="deleteFacility(event, '${fac.id}', '${fac.name}')" style="margin-top: 15px; border: 1px solid #dc3545; padding: 5px 10px; border-radius: 4px;">施設を削除</button>
        `;
        facilityList.appendChild(card);
    });
}

function addFacility() {
    const name = prompt('新しい施設名を入力してください:');
    if (!name) return;

    let facilities = JSON.parse(localStorage.getItem('myFacilities')) || [];
    if (facilities.some(f => f.name === name)) return alert('その施設名は既に存在します');

    facilities.push({ id: 'fac-' + Date.now(), name: name });
    localStorage.setItem('myFacilities', JSON.stringify(facilities));
    displayFacilities();
}

function deleteFacility(event, id, facName) {
    event.stopPropagation();
    if(!confirm(`「${facName}」を削除しますか？\n※所属している入居者のデータも全て消去されます！`)) return;
    
    let facilities = JSON.parse(localStorage.getItem('myFacilities')) || [];
    facilities = facilities.filter(f => f.id !== id);
    localStorage.setItem('myFacilities', JSON.stringify(facilities));

    let users = JSON.parse(localStorage.getItem('myUsers')) || [];
    users = users.filter(u => u.place !== facName);
    localStorage.setItem('myUsers', JSON.stringify(users));

    displayFacilities();
}

// 年齢の自動計算
function calculateAge(dobString) {
    if (!dobString) return '未入力';
    const dob = new Date(dobString);
    const today = new Date();
    if (isNaN(dob.getTime())) return '不正な日付';
    
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return `${dobString} <br><span style="font-size: 0.9em; color: #007bff; font-weight: bold;">(${age}歳)</span>`;
}

// ==========================================
// 5. 入居者の表示・並べ替え機能
// ==========================================
function displayUsers() {
    if (!userList) return;
    userList.innerHTML = '';
    const allUsers = JSON.parse(localStorage.getItem('myUsers')) || [];
    const currentFac = currentFacilityName.textContent;

    let facilityUsers = allUsers.filter(u => u.place === currentFac);

    if (searchInput && searchInput.value) {
        const query = searchInput.value.toLowerCase();
        facilityUsers = facilityUsers.filter(u => Object.values(u).some(v => String(v).toLowerCase().includes(query)));
    }

    if (sortSelect && sortSelect.value !== 'none') {
        const sortValue = sortSelect.value;
        facilityUsers.sort((a, b) => {
            if (sortValue === 'id-asc') return Number(a.id) - Number(b.id);
            if (sortValue === 'name-asc') return a.name.localeCompare(b.name, 'ja');
            return 0;
        });
    }

    facilityUsers.forEach(addUserToTable);
}

function addUserToTable(user) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${calculateAge(user.dob)}</td>
        <td>${user.moveIn || '未入力'}</td>
        <td>
            <div class="btn-group" style="display: flex; gap: 5px;">
                <button class="detail-btn" onclick="openModalForEdit('${user.id}')">詳細</button>
                <button style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;" onclick="exportToExcel('${user.id}')">Excel</button>
                <button class="delete-btn" onclick="deleteUser('${user.id}')">削除</button>
            </div>
        </td>
    `;
    userList.appendChild(tr);
}

// ==========================================
// 6. モーダルの開閉と保存
// ==========================================
function openModalForAdd() {
    currentEditingId = null;
    modalTitle.textContent = "新規入居者登録";
    idInput.disabled = false;
    [idInput, nameInput, dobInput, moveInInput, infoInput].forEach(el => el.value = '');
    placeInput.value = currentFacilityName.textContent;
    document.getElementById('user-modal').style.display = 'block';
}

function openModalForEdit(id) {
    const users = JSON.parse(localStorage.getItem('myUsers')) || [];
    const user = users.find(u => u.id === id);
    if (!user) return;

    currentEditingId = id;
    modalTitle.textContent = "入居者情報の編集";
    idInput.value = user.id;
    idInput.disabled = true; 
    nameInput.value = user.name;
    dobInput.value = user.dob || '';
    moveInInput.value = user.moveIn || '';
    placeInput.value = user.place;
    infoInput.value = user.info;

    document.getElementById('user-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('user-modal').style.display = 'none';
}

saveBtn.addEventListener('click', () => {
    const user = { 
        id: idInput.value, 
        name: nameInput.value, 
        place: placeInput.value, 
        dob: dobInput.value, 
        moveIn: moveInInput.value, 
        info: infoInput.value 
    };
    
    if (!user.id || !user.name) return alert('居室番号と名前は必須です');

    let users = JSON.parse(localStorage.getItem('myUsers')) || [];

    if (currentEditingId) {
        users = users.map(u => u.id === currentEditingId ? user : u);
    } else {
        if (users.some(u => u.id === user.id && u.place === user.place)) {
            return alert('この施設に同じ居室番号が存在します');
        }
        users.push(user);
    }

    localStorage.setItem('myUsers', JSON.stringify(users));
    closeModal();
    displayUsers(); 
    displayFacilities(); 
});

function deleteUser(id) {
    if(!confirm('本当に削除しますか？')) return;
    let users = JSON.parse(localStorage.getItem('myUsers')) || [];
    users = users.filter(u => u.id !== id);
    localStorage.setItem('myUsers', JSON.stringify(users));
    displayUsers();
    displayFacilities();
}

// ==========================================
// 7. エクセル出力機能（年・月・日 分割対応）
// ==========================================
async function exportToExcel(userId) {
    const users = JSON.parse(localStorage.getItem('myUsers')) || [];
    const user = users.find(u => u.id === userId);
    if (!user) return alert('データが見つかりません');

    try {
        const response = await fetch('template.xlsx');
        if (!response.ok) throw new Error('テンプレートファイル (template.xlsx) が見つかりません。');
        const arrayBuffer = await response.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0]; 

        // 基本データの書き込み
        worksheet.getCell('Y3').value = user.place;
        worksheet.getCell('AE3').value = user.id;
        worksheet.getCell('D6').value = user.name;
        
        // 🌟 生年月日を和暦で入力する場合の例（座標は適宜調整してください）
        if (user.dob) {
            const eraYear = convertToJapaneseEra(user.dob); // 例：「昭和50年」
            worksheet.getCell('V6').value = eraYear; 

            // もし「年」だけ取り出したい場合は、さらに分割も可能です
            const [y, m, d] = user.dob.split('-');
            worksheet.getCell('Z6').value = m; // 月
            worksheet.getCell('AB6').value = d; // 日
        }

        // 🌟 入居日を分割して入力
        if (user.moveIn && user.moveIn.includes('-')) {
            const [my, mm, md] = user.moveIn.split('-');
            worksheet.getCell('E4').value = my; // 入居年の座標
            worksheet.getCell('I4').value = mm; // 入居月の座標
            worksheet.getCell('M4').value = md; // 入居日の座標
        }

        const uint8Array = await workbook.xlsx.writeBuffer();
        const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${user.name}_出力.xlsx`;
        a.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        alert('Excel出力エラー: ' + error.message);
    }
}

// ==========================================
// 8. 検索・その他
// ==========================================
if (searchInput) {
    searchInput.addEventListener('input', displayUsers);
}

window.onclick = (e) => { if(e.target.className === 'modal-overlay') closeModal(); }

function exportData() {
    const backupData = {
        facilities: JSON.parse(localStorage.getItem('myFacilities')) || [],
        users: JSON.parse(localStorage.getItem('myUsers')) || []
    };
    const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nursing_home_backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(data.facilities) localStorage.setItem('myFacilities', JSON.stringify(data.facilities));
            if(data.users) localStorage.setItem('myUsers', JSON.stringify(data.users));
            displayFacilities();
            alert('データの読み込みに成功しました！');
        } catch (error) {
            alert('失敗しました。');
        }
    };
    reader.readAsText(file);
}

// 🌟 和暦（令和・平成など）に変換する関数
function convertToJapaneseEra(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    // Intl.DateTimeFormat を使って和暦に変換
    return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
        era: 'long',
        year: 'numeric'
    }).format(date);
}