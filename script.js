// ===== حاسبة GPA =====

function addSubject() {
  const list = document.getElementById('subjects-list');
  const row = document.createElement('div');
  row.className = 'subject-row';
  row.innerHTML = `
    <input type="text" class="subject-name" placeholder="اسم المادة" />
    <input type="number" class="subject-grade" placeholder="الدرجة" min="0" max="100" />
    <select class="subject-hours">
      <option value="1">1 ساعة</option>
      <option value="2">2 ساعة</option>
      <option value="3" selected>3 ساعات</option>
      <option value="4">4 ساعات</option>
    </select>
    <button class="delete-btn" onclick="deleteRow(this)">🗑</button>
  `;
  list.appendChild(row);
}

function deleteRow(btn) {
  const rows = document.querySelectorAll('.subject-row');
  if (rows.length > 1) btn.parentElement.remove();
}

function gradeToPoints(grade) {
  if (grade >= 95) return 4.0;
  if (grade >= 90) return 3.75;
  if (grade >= 85) return 3.5;
  if (grade >= 80) return 3.0;
  if (grade >= 75) return 2.5;
  if (grade >= 70) return 2.0;
  if (grade >= 65) return 1.5;
  if (grade >= 60) return 1.0;
  return 0.0;
}

function getGradeLabel(gpa) {
  if (gpa >= 3.75) return { text: '✦ ممتاز مرتفع', color: '#16A34A' };
  if (gpa >= 3.5)  return { text: '✦ ممتاز',        color: '#16A34A' };
  if (gpa >= 3.0)  return { text: '✦ جيد جداً',     color: '#2563EB' };
  if (gpa >= 2.0)  return { text: '✦ جيد',           color: '#D97706' };
  if (gpa >= 1.0)  return { text: '✦ مقبول',         color: '#EA580C' };
  return { text: '✦ راجع وضعك 😬', color: '#DC2626' };
}

function calculateGPA() {
  const names  = document.querySelectorAll('.subject-name');
  const grades = document.querySelectorAll('.subject-grade');
  const hours  = document.querySelectorAll('.subject-hours');

  let totalPoints = 0;
  let totalHours  = 0;
  let valid       = true;
  let barsHTML    = '';

  for (let i = 0; i < grades.length; i++) {
    const grade = parseFloat(grades[i].value);
    const hour  = parseInt(hours[i].value);
    const name  = names[i].value || `مادة ${i + 1}`;

    if (isNaN(grade) || grade < 0 || grade > 100) {
      grades[i].style.border = '2px solid #EF4444';
      valid = false;
      continue;
    } else {
      grades[i].style.border = '';
    }

    const points = gradeToPoints(grade);
    totalPoints += points * hour;
    totalHours  += hour;

    barsHTML += `
      <div class="prog-row">
        <div class="prog-lbl">${name}</div>
        <div class="prog-track">
          <div class="prog-fill" style="width:${grade}%; background:var(--blue-mid)"></div>
        </div>
        <div class="prog-val">${grade}%</div>
      </div>
    `;
  }

  if (!valid || totalHours === 0) return;

  const gpa   = (totalPoints / totalHours).toFixed(2);
  const label = getGradeLabel(parseFloat(gpa));

  document.getElementById('gpa-result').textContent  = gpa;
  document.getElementById('grade-label').textContent = label.text;
  document.getElementById('grade-label').style.color = label.color;
  document.getElementById('bars-list').innerHTML     = barsHTML;

  // أظهر زر الحفظ
  document.getElementById('save-gpa-btn').style.display = 'block';
}

function saveGPA() {
  const gpa = document.getElementById('gpa-result').textContent;
  if (gpa === '–') return;

  fetch('/save-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'gpa',
      data: `المعدل: ${gpa} من 4.0`
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('✅ تم حفظ النتيجة في حسابك!');
    } else {
      alert('⚠ ' + data.message);
    }
  })
  .catch(() => alert('⚠ يرجى تسجيل الدخول أولاً'));
}

// ===== حاسبة الميزانية =====

function addExpense() {
  const list = document.getElementById('expenses-list');
  const row  = document.createElement('div');
  row.className = 'expense-row';
  row.innerHTML = `
    <input type="text" class="expense-name" placeholder="نوع المصروف">
    <input type="number" class="expense-amount" placeholder="المبلغ" min="0">
    <button class="delete-btn" onclick="deleteExpense(this)">🗑</button>
  `;
  list.appendChild(row);
}

function deleteExpense(btn) {
  const rows = document.querySelectorAll('.expense-row');
  if (rows.length > 1) btn.parentElement.remove();
}

function calculateBudget() {
  const income = parseFloat(document.getElementById('income').value);
  if (isNaN(income) || income <= 0) {
    document.getElementById('income').style.border = '2px solid #EF4444';
    return;
  }
  document.getElementById('income').style.border = '';

  const names   = document.querySelectorAll('.expense-name');
  const amounts = document.querySelectorAll('.expense-amount');

  let totalExpenses = 0;
  let barsHTML      = '';

  for (let i = 0; i < amounts.length; i++) {
    const amount = parseFloat(amounts[i].value) || 0;
    const name   = names[i].value || `مصروف ${i + 1}`;
    totalExpenses += amount;

    const pct = Math.min((amount / income) * 100, 100).toFixed(0);
    barsHTML += `
      <div class="prog-row">
        <div class="prog-lbl">${name}</div>
        <div class="prog-track">
          <div class="prog-fill" style="width:${pct}%; background:var(--gold)"></div>
        </div>
        <div class="prog-val">${amount}</div>
      </div>
    `;
  }

  const remaining = income - totalExpenses;
  document.getElementById('remaining').textContent = remaining.toFixed(0);

  const label = document.getElementById('budget-label');
  if (remaining >= 0) {
    label.textContent = `✦ متبقي ${remaining.toFixed(0)} ريال 💚`;
    label.style.color = '#16A34A';
  } else {
    label.textContent = `⚠ تجاوزت ميزانيتك بـ ${Math.abs(remaining).toFixed(0)} ريال!`;
    label.style.color = '#DC2626';
  }

  document.getElementById('budget-bars').innerHTML = barsHTML;

  // أظهر زر الحفظ
  document.getElementById('save-budget-btn').style.display = 'block';
}

function saveBudget() {
  const remaining = document.getElementById('remaining').textContent;
  if (remaining === '–') return;

  fetch('/save-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'budget',
      data: `المتبقي: ${remaining} ريال`
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('✅ تم حفظ النتيجة في حسابك!');
    } else {
      alert('⚠ ' + data.message);
    }
  })
  .catch(() => alert('⚠ يرجى تسجيل الدخول أولاً'));
}

// ===== حاسبة الدراسة =====

function addStudySubject() {
  const list = document.getElementById('subjects-study-list');
  const row  = document.createElement('div');
  row.className = 'study-row';
  row.innerHTML = `
    <input type="text" class="study-name" placeholder="اسم المادة">
    <select class="study-difficulty">
      <option value="1">سهلة</option>
      <option value="2" selected>متوسطة</option>
      <option value="3">صعبة</option>
    </select>
    <button class="delete-btn" onclick="deleteStudyRow(this)">🗑</button>
  `;
  list.appendChild(row);
}

function deleteStudyRow(btn) {
  const rows = document.querySelectorAll('.study-row');
  if (rows.length > 1) btn.parentElement.remove();
}

function calculateStudyPlan() {
  const days  = parseInt(document.getElementById('study-days').value);
  const hours = parseInt(document.getElementById('daily-hours').value);

  if (!days || !hours) return;

  const names  = document.querySelectorAll('.study-name');
  const levels = document.querySelectorAll('.study-difficulty');

  let subjects    = [];
  let totalWeight = 0;

  for (let i = 0; i < names.length; i++) {
    const name   = names[i].value || `مادة ${i + 1}`;
    const weight = parseInt(levels[i].value);
    subjects.push({ name, weight });
    totalWeight += weight;
  }

  const totalHours = days * hours;
  let planHTML = '';

  subjects.forEach(sub => {
    const subHours = ((sub.weight / totalWeight) * totalHours).toFixed(1);
    const emoji    = sub.weight === 3 ? '🔴' : sub.weight === 2 ? '🟡' : '🟢';
    planHTML += `
      <div class="prog-row">
        <div class="prog-lbl">${emoji} ${sub.name}</div>
        <div class="prog-track">
          <div class="prog-fill fill-blue" style="width:${(sub.weight / 3) * 100}%"></div>
        </div>
        <div class="prog-val">${subHours}س</div>
      </div>
    `;
  });

  planHTML += `
    <div style="margin-top:14px;text-align:center;font-size:12px;color:var(--muted);font-weight:700;">
      إجمالي ساعات الدراسة: ${totalHours} ساعة خلال ${days} أيام
    </div>
  `;

  document.getElementById('study-plan-output').innerHTML = planHTML;
  document.querySelector('#study-result div').style.display = 'none';
}

// ===== نموذج التسجيل + Validation =====

function submitForm() {
  let valid = true;

  const firstName = document.getElementById('first-name');
  const lastName  = document.getElementById('last-name');
  const email     = document.getElementById('email');
  const password  = document.getElementById('password');
  const confirm   = document.getElementById('confirm-password');

  document.querySelectorAll('.field-input').forEach(i => i.classList.remove('error'));
  document.getElementById('email-error').textContent    = '';
  document.getElementById('password-error').textContent = '';
  document.getElementById('confirm-error').textContent  = '';

  if (!firstName.value.trim()) { firstName.classList.add('error'); valid = false; }
  if (!lastName.value.trim())  { lastName.classList.add('error');  valid = false; }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    email.classList.add('error');
    document.getElementById('email-error').textContent = '⚠ يرجى إدخال بريد إلكتروني صحيح';
    valid = false;
  }

  if (password.value.length < 8) {
    password.classList.add('error');
    document.getElementById('password-error').textContent = '⚠ كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    valid = false;
  }

  if (password.value !== confirm.value) {
    confirm.classList.add('error');
    document.getElementById('confirm-error').textContent = '⚠ كلمة المرور غير متطابقة';
    valid = false;
  }

  if (!valid) return;

  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: firstName.value.trim(),
      last_name:  lastName.value.trim(),
      email:      email.value.trim(),
      university: document.getElementById('university').value.trim(),
      password:   password.value
    })
  })
  .then(res => {
    if (!res.ok && res.status !== 409 && res.status !== 400) {
      throw new Error('server error');
    }
    return res.json();
  })
  .then(data => {
    const msg = document.getElementById('success-msg');
    if (data.success) {
      msg.style.color = '#16A34A';
      msg.textContent = '✅ ' + data.message;
      document.querySelectorAll('.field-input').forEach(i => i.value = '');
    } else {
      msg.style.color = '#DC2626';
      msg.textContent = '⚠ ' + data.message;
    }
  })
  .catch(() => {
    document.getElementById('success-msg').style.color = '#DC2626';
    document.getElementById('success-msg').textContent = '⚠ حدث خطأ، حاول مرة أخرى';
  });
}

// ===== تسجيل الدخول =====

function submitLogin() {
  const email    = document.getElementById('login-email');
  const password = document.getElementById('login-password');

  document.getElementById('login-email-error').textContent    = '';
  document.getElementById('login-password-error').textContent = '';
  email.classList.remove('error');
  password.classList.remove('error');

  let valid = true;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    email.classList.add('error');
    document.getElementById('login-email-error').textContent = '⚠ يرجى إدخال بريد إلكتروني صحيح';
    valid = false;
  }

  if (!password.value) {
    password.classList.add('error');
    document.getElementById('login-password-error').textContent = '⚠ يرجى إدخال كلمة المرور';
    valid = false;
  }

  if (!valid) return;

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email:    email.value.trim(),
      password: password.value
    })
  })
  .then(res => {
    if (!res.ok && res.status !== 401) {
      throw new Error('server error');
    }
    return res.json();
  })
  .then(data => {
    const msg = document.getElementById('login-msg');
    if (data.success) {
      msg.style.color = '#16A34A';
      msg.textContent = '✅ ' + data.message;
      setTimeout(() => { window.location.href = '/profile'; }, 1000);
    } else {
      msg.style.color = '#DC2626';
      msg.textContent = '⚠ ' + data.message;
    }
  })
  .catch(() => {
    document.getElementById('login-msg').style.color = '#DC2626';
    document.getElementById('login-msg').textContent = '⚠ حدث خطأ، حاول مرة أخرى';
  });
}

// ===== التبويبين =====
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  event.target.classList.add('active');
}
// ===== Hamburger Menu =====
function toggleMenu() {
  const nav     = document.querySelector('.nav-links');
  const burger  = document.getElementById('hamburger');
  const overlay = document.getElementById('nav-overlay');
  if (nav)     nav.classList.toggle('open');
  if (burger)  burger.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}