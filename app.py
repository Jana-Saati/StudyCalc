from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import os
from datetime import date, datetime, timedelta

app = Flask(__name__)
app.secret_key = 'studycalc2026'

# ===== مسار قاعدة البيانات =====
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

# ===== إعداد قاعدة البيانات =====
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name  TEXT NOT NULL,
            email      TEXT NOT NULL UNIQUE,
            university TEXT,
            password   TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS results (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            type       TEXT NOT NULL,
            data       TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS points (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER NOT NULL UNIQUE,
            total_points INTEGER DEFAULT 0,
            streak_days  INTEGER DEFAULT 0,
            last_login   DATE,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    conn.commit()
    conn.close()

# ===== دالة إضافة نقاط =====
def add_points(user_id, pts):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO points (user_id, total_points)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
        total_points = total_points + ?
    ''', (user_id, pts, pts))
    conn.commit()
    conn.close()

# ===== الصفحات الرئيسية =====
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/gpa')
def gpa():
    return render_template('gpa.html')

@app.route('/budget')
def budget():
    return render_template('budget.html')

@app.route('/study')
def study():
    return render_template('study.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

# ===== صفحة تواصل معنا المنفصلة =====
@app.route('/reach-us')
def reach_us():
    return render_template('reach_us.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('contact'))
    return render_template('dashboard.html')

@app.route('/quiz')
def quiz():
    return render_template('quiz.html')

# ===== صفحة الأدمن =====
@app.route('/admin')
def admin():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
    users = cursor.fetchall()
    conn.close()
    return render_template('admin.html', users=users)

# ===== تسجيل حساب جديد =====
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    first_name = data.get('first_name', '').strip()
    last_name  = data.get('last_name', '').strip()
    email      = data.get('email', '').strip()
    university = data.get('university', '').strip()
    password   = data.get('password', '').strip()

    if not first_name or not last_name or not email or not password:
        return jsonify({'success': False, 'message': 'يرجى تعبئة جميع الحقول المطلوبة'}), 400

    if len(password) < 8:
        return jsonify({'success': False, 'message': 'كلمة المرور قصيرة جداً'}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (first_name, last_name, email, university, password)
            VALUES (?, ?, ?, ?, ?)
        ''', (first_name, last_name, email, university, password))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'تم إنشاء الحساب بنجاح! 🎓'})

    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'البريد الإلكتروني مسجل مسبقاً'}), 409

# ===== تسجيل الدخول =====
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')

    data     = request.get_json()
    email    = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'success': False, 'message': 'يرجى إدخال البريد وكلمة المرور'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        session['user_id']   = user[0]
        session['user_name'] = user[1]

        today = str(date.today())
        conn2 = sqlite3.connect(DB_PATH)
        cur2  = conn2.cursor()
        cur2.execute('SELECT last_login FROM points WHERE user_id = ?', (user[0],))
        login_row = cur2.fetchone()
        if not login_row or login_row[0] != today:
            cur2.execute('''
                INSERT INTO points (user_id, total_points, last_login)
                VALUES (?, 5, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                total_points = total_points + 5,
                last_login   = ?
            ''', (user[0], today, today))
            conn2.commit()
        conn2.close()

        return jsonify({'success': True, 'message': f'مرحباً {user[1]}!'})
    else:
        return jsonify({'success': False, 'message': 'البريد أو كلمة المرور غير صحيحة'}), 401

# ===== تسجيل الخروج =====
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# ===== صفحة الملف الشخصي =====
@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('contact'))

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],))
    user = cursor.fetchone()
    cursor.execute('SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC', (session['user_id'],))
    results = cursor.fetchall()
    conn.close()

    return render_template('profile.html', user=user, results=results)

# ===== حفظ النتائج =====
@app.route('/save-result', methods=['POST'])
def save_result():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'يرجى تسجيل الدخول أولاً'}), 401

    data        = request.get_json()
    result_type = data.get('type')
    result_data = data.get('data')

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO results (user_id, type, data)
        VALUES (?, ?, ?)
    ''', (session['user_id'], result_type, result_data))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'تم حفظ النتيجة ✅'})

# ===== تسجيل يوم مذاكرة =====
@app.route('/checkin', methods=['POST'])
def checkin():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'سجّل دخولك أولاً'}), 401

    today     = str(date.today())
    yesterday = str(date.today() - timedelta(days=1))
    user_id   = session['user_id']

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT last_login, streak_days FROM points WHERE user_id = ?', (user_id,))
    row = cursor.fetchone()

    if row and row[0] == today:
        conn.close()
        return jsonify({'success': False, 'message': 'سجّلت يومك بالفعل ✅'})

    if row and row[0] == yesterday:
        new_streak = row[1] + 1
        bonus = 10
    else:
        new_streak = 1
        bonus = 0

    points_earned = 20 + bonus

    cursor.execute('''
        INSERT INTO points (user_id, total_points, streak_days, last_login)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
        total_points = total_points + ?,
        streak_days  = ?,
        last_login   = ?
    ''', (user_id, points_earned, new_streak, today,
          points_earned, new_streak, today))
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': f'تم تسجيل يومك! +{points_earned} نقطة 🎉',
        'streak':  new_streak,
        'points':  points_earned
    })

# ===== إضافة اختبار =====
@app.route('/add-exam', methods=['POST'])
def add_exam():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'سجّل دخولك أولاً'}), 401

    data      = request.get_json()
    exam_name = data.get('name', '').strip()
    exam_date = data.get('date', '').strip()

    if not exam_name or not exam_date:
        return jsonify({'success': False, 'message': 'أدخل اسم المادة والتاريخ'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO results (user_id, type, data)
        VALUES (?, 'exam', ?)
    ''', (session['user_id'], f'{exam_name}|{exam_date}'))
    conn.commit()
    conn.close()

    add_points(session['user_id'], 10)
    return jsonify({'success': True, 'message': f'تمت إضافة {exam_name} — +10 نقاط ✅'})

# ===== إنشاء خطة مذاكرة =====
@app.route('/add-plan', methods=['POST'])
def add_plan():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'سجّل دخولك أولاً'}), 401

    add_points(session['user_id'], 15)
    return jsonify({'success': True, 'message': '+15 نقطة على إنشاء الخطة ✅'})

# ===== بيانات الداشبورد =====
@app.route('/dashboard-data')
def dashboard_data():
    if 'user_id' not in session:
        return jsonify({'success': False}), 401

    user_id = session['user_id']
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('SELECT total_points, streak_days FROM points WHERE user_id = ?', (user_id,))
    pts_row   = cursor.fetchone()
    my_points = pts_row[0] if pts_row else 0
    my_streak = pts_row[1] if pts_row else 0

    cursor.execute('''
        SELECT data FROM results
        WHERE user_id = ? AND type = "exam"
        ORDER BY created_at DESC
    ''', (user_id,))
    exams_raw = cursor.fetchall()

    cursor.execute('''
        SELECT u.first_name, p.total_points
        FROM points p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.total_points DESC
        LIMIT 5
    ''')
    leaderboard = cursor.fetchall()
    conn.close()

    exams = []
    for e in exams_raw:
        parts = e[0].split('|')
        if len(parts) == 2:
            name, exam_date = parts
            try:
                days_left = (datetime.strptime(exam_date, '%Y-%m-%d').date()
                             - date.today()).days
                if days_left >= 0:
                    exams.append({'name': name, 'days': days_left})
            except:
                pass

    return jsonify({
        'success':     True,
        'my_points':   my_points,
        'my_streak':   my_streak,
        'user_name':   session.get('user_name', ''),
        'exams':       exams,
        'leaderboard': [{'name': r[0], 'points': r[1]} for r in leaderboard]
    })

# ===== تشغيل التطبيق =====
if __name__ == '__main__':
    init_db()
    app.run(debug=True)