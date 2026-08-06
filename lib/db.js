import bcrypt from "bcryptjs";
import postgres from "postgres";

// ---------------------------------------------------------------------------
// Postgres-backed data layer (AWS RDS for PostgreSQL).
// Schema is created and seeded lazily on first use, cached per warm compute
// instance, so cold starts self-heal without a separate migration step.
// ---------------------------------------------------------------------------

const g = globalThis;

function getSql() {
  if (!g.__HR_SQL__) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set.");
    }
    g.__HR_SQL__ = postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      types: {
        // Return DATE columns as plain "YYYY-MM-DD" strings instead of JS
        // Date objects, since the app compares/renders them as strings.
        date: {
          to: 1082,
          from: [1082],
          serialize: (x) => x,
          parse: (x) => x,
        },
      },
    });
  }
  return g.__HR_SQL__;
}

async function ensureReady() {
  if (!g.__HR_DB_READY__) {
    g.__HR_DB_READY__ = initSchemaAndSeed();
  }
  return g.__HR_DB_READY__;
}

async function initSchemaAndSeed() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      position TEXT,
      join_date DATE,
      unit TEXT,
      photo TEXT,
      national_id TEXT,
      phone TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS unit TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_to INTEGER REFERENCES users(id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS leave_types (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      quota_days INTEGER
    )
  `;
  const [{ count: leaveTypeCount }] = await sql`SELECT COUNT(*)::int AS count FROM leave_types`;
  if (leaveTypeCount === 0) {
    await sql`
      INSERT INTO leave_types (name, label, quota_days) VALUES
      ('annual', 'Annual', 20),
      ('sick', 'Sick', 10),
      ('casual', 'Casual', 7),
      ('unpaid', 'Unpaid', NULL)
    `;
  }
  await sql`
    CREATE TABLE IF NOT EXISTS employee_documents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      doc_type TEXT DEFAULT 'other',
      mime_type TEXT,
      file_data TEXT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date DATE NOT NULL,
      check_in TEXT,
      check_out TEXT,
      status TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS salary_slips (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      month INTEGER NOT NULL,
      month_label TEXT NOT NULL,
      year INTEGER NOT NULL,
      basic NUMERIC NOT NULL,
      allowances NUMERIC DEFAULT 0,
      deductions NUMERIC DEFAULT 0,
      net_pay NUMERIC NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_date DATE
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      posted_by TEXT,
      posted_at DATE NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      days INTEGER NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      applied_on DATE NOT NULL,
      review_note TEXT DEFAULT ''
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS service_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      amount NUMERIC,
      details TEXT,
      status TEXT DEFAULT 'pending',
      applied_on DATE NOT NULL,
      review_note TEXT DEFAULT ''
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS appraisals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      cycle TEXT NOT NULL,
      status TEXT DEFAULT 'not_started',
      self_rating INTEGER,
      manager_rating INTEGER,
      goals TEXT,
      feedback TEXT DEFAULT '',
      due_date DATE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      check_in_deadline TEXT NOT NULL DEFAULT '08:30',
      working_hours NUMERIC NOT NULL DEFAULT 6,
      weekend_days TEXT NOT NULL DEFAULT '5,6',
      work_start_time TEXT NOT NULL DEFAULT '08:00',
      work_end_time TEXT NOT NULL DEFAULT '14:00',
      late_deduction_per_day NUMERIC NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT now()
    )
  `;
  await sql`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS work_start_time TEXT NOT NULL DEFAULT '08:00'`;
  await sql`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS work_end_time TEXT NOT NULL DEFAULT '14:00'`;
  await sql`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS late_deduction_per_day NUMERIC NOT NULL DEFAULT 0`;
  await sql`
    INSERT INTO company_settings (id, check_in_deadline, working_hours, weekend_days, work_start_time, work_end_time, late_deduction_per_day)
    VALUES (1, '08:30', 6, '5,6', '08:00', '14:00', 0)
    ON CONFLICT (id) DO NOTHING
  `;
  // One-time correction: earlier builds seeded a placeholder 10:00/8h default before
  // the official 8:00am-2:00pm / 8:30 late-threshold policy existed. Only touch rows
  // that are still at that original placeholder so HR customizations are never overwritten.
  await sql`
    UPDATE company_settings
    SET check_in_deadline = '08:30', working_hours = 6, work_start_time = '08:00', work_end_time = '14:00'
    WHERE id = 1 AND check_in_deadline = '10:00' AND working_hours = 8
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sections (
      id SERIAL PRIMARY KEY,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS units (
      id SERIAL PRIMARY KEY,
      section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS holidays (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      type TEXT DEFAULT 'holiday',
      adjusted_start_time TEXT,
      adjusted_end_time TEXT,
      created_at TIMESTAMP DEFAULT now()
    )
  `;
  await sql`ALTER TABLE holidays ADD COLUMN IF NOT EXISTS adjusted_start_time TEXT`;
  await sql`ALTER TABLE holidays ADD COLUMN IF NOT EXISTS adjusted_end_time TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS time_change_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      attendance_id INTEGER NOT NULL REFERENCES attendance(id),
      date DATE NOT NULL,
      current_check_in TEXT,
      requested_check_in TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      applied_on DATE NOT NULL,
      review_note TEXT DEFAULT ''
    )
  `;

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM users`;
  if (count === 0) {
    await seed(sql);
  }
}

async function seed(sql) {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const seedUsers = [
    { name: "Ayesha Khan", email: "hr@company.com", password: "hr123456", role: "hr", department: "Human Resources", position: "HR Manager", joinDate: "2020-03-01" },
    { name: "Bilal Ahmed", email: "employee@company.com", password: "employee123", role: "employee", department: "Engineering", position: "Software Engineer", joinDate: "2022-06-15" },
    { name: "Sara Malik", email: "sara@company.com", password: "employee123", role: "employee", department: "Design", position: "UI/UX Designer", joinDate: "2023-01-10" },
  ];

  const userIds = {};
  for (const u of seedUsers) {
    const [row] = await sql`
      INSERT INTO users (name, email, password_hash, role, department, position, join_date)
      VALUES (${u.name}, ${u.email}, ${bcrypt.hashSync(u.password, 8)}, ${u.role}, ${u.department}, ${u.position}, ${u.joinDate})
      RETURNING id
    `;
    userIds[u.email] = row.id;
  }

  for (const email of ["employee@company.com", "sara@company.com"]) {
    const userId = userIds[email];
    for (let i = 1; i <= 10; i++) {
      const d = daysAgo(i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const roll = Math.random();
      let status = "present";
      let checkIn = "09:0" + (roll > 0.5 ? "3" : "0");
      let checkOut = "18:0" + (roll > 0.5 ? "1" : "5");
      if (roll < 0.08) {
        status = "absent";
        checkIn = null;
        checkOut = null;
      } else if (roll < 0.2) {
        status = "late";
        checkIn = "10:15";
      }
      await sql`
        INSERT INTO attendance (user_id, date, check_in, check_out, status)
        VALUES (${userId}, ${iso(d)}, ${checkIn}, ${checkOut}, ${status})
      `;
    }
  }

  for (const [email, dept] of [["employee@company.com", "Engineering"], ["sara@company.com", "Design"]]) {
    const userId = userIds[email];
    const basic = dept === "Engineering" ? 180000 : 150000;
    for (let i = 3; i >= 1; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const allowances = Math.round(basic * 0.2);
      const deductions = Math.round(basic * 0.08);
      await sql`
        INSERT INTO salary_slips (user_id, month, month_label, year, basic, allowances, deductions, net_pay, status, pay_date)
        VALUES (${userId}, ${d.getMonth() + 1}, ${monthNames[d.getMonth()]}, ${d.getFullYear()}, ${basic}, ${allowances}, ${deductions}, ${basic + allowances - deductions}, 'paid', ${iso(new Date(d.getFullYear(), d.getMonth() + 1, 1))})
      `;
    }
  }

  const seedAnnouncements = [
    { title: "Office closed on National Day", body: "The office will remain closed in observance of National Day. Regular operations resume the following working day.", priority: "important", daysAgoVal: 2 },
    { title: "Open enrollment for health insurance", body: "Open enrollment for annual health insurance plans starts this month. Please review your options on the benefits portal and submit selections before the deadline.", priority: "normal", daysAgoVal: 5 },
    { title: "Mandatory security awareness training", body: "All staff must complete the security awareness training module by the end of this month. Reach out to HR if you need access to the training link.", priority: "urgent", daysAgoVal: 1 },
  ];
  for (const a of seedAnnouncements) {
    await sql`
      INSERT INTO announcements (title, body, priority, posted_by, posted_at)
      VALUES (${a.title}, ${a.body}, ${a.priority}, 'Ayesha Khan', ${iso(daysAgo(a.daysAgoVal))})
    `;
  }

  await sql`
    INSERT INTO leave_requests (user_id, type, start_date, end_date, days, reason, status, applied_on, review_note)
    VALUES (${userIds["employee@company.com"]}, 'annual', ${iso(daysAgo(-10))}, ${iso(daysAgo(-8))}, 3, 'Family trip', 'pending', ${iso(daysAgo(1))}, '')
  `;
  await sql`
    INSERT INTO leave_requests (user_id, type, start_date, end_date, days, reason, status, applied_on, review_note)
    VALUES (${userIds["sara@company.com"]}, 'sick', ${iso(daysAgo(6))}, ${iso(daysAgo(6))}, 1, 'Fever', 'approved', ${iso(daysAgo(6))}, 'Get well soon')
  `;

  await sql`
    INSERT INTO service_requests (user_id, type, amount, details, status, applied_on, review_note)
    VALUES (${userIds["employee@company.com"]}, 'cash_advance', 25000, 'Medical emergency for family member', 'pending', ${iso(daysAgo(2))}, '')
  `;
  await sql`
    INSERT INTO service_requests (user_id, type, amount, details, status, applied_on, review_note)
    VALUES (${userIds["sara@company.com"]}, 'equipment', NULL, 'Requesting an external monitor for home office setup', 'approved', ${iso(daysAgo(9))}, 'Approved, collect from IT desk')
  `;

  await sql`
    INSERT INTO appraisals (user_id, cycle, status, self_rating, manager_rating, goals, feedback, due_date)
    VALUES (${userIds["employee@company.com"]}, '2026 H1', 'in_progress', 4, NULL, 'Ship the new reporting module; mentor junior engineer; improve test coverage to 80%.', '', ${iso(daysAgo(-20))})
  `;
  await sql`
    INSERT INTO appraisals (user_id, cycle, status, self_rating, manager_rating, goals, feedback, due_date)
    VALUES (${userIds["sara@company.com"]}, '2026 H1', 'completed', 5, 4, 'Redesign onboarding flow; establish design system v2.', 'Strong design leadership this cycle, great collaboration with engineering.', ${iso(daysAgo(15))})
  `;
}

const strip = (u) => {
  if (!u) return u;
  const { password_hash, ...safe } = u;
  return { ...safe, passwordHash: password_hash };
};

const toClient = (u) => {
  if (!u) return u;
  const { password_hash, ...rest } = u;
  return rest;
};

// ---- Users -----------------------------------------------------------------
export async function getUserByEmail(email) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`SELECT * FROM users WHERE lower(email) = lower(${email})`;
  return strip(row);
}
export async function getUserById(id) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`SELECT * FROM users WHERE id = ${Number(id)}`;
  return strip(row);
}
export async function listEmployees() {
  await ensureReady();
  const sql = getSql();
  // Exclude the (potentially large, base64) photo column from list views;
  // it's only needed on the single-employee profile fetch (getUserById).
  const rows = await sql`
    SELECT id, name, email, role, department, position, join_date, unit,
           (photo IS NOT NULL) AS "hasPhoto"
    FROM users ORDER BY id
  `;
  return rows;
}
export async function createUser({ name, email, password, department, position }) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO users (name, email, password_hash, role, department, position, join_date)
    VALUES (${name}, ${email}, ${bcrypt.hashSync(password, 8)}, 'employee', ${department || "General"}, ${position || "Employee"}, ${new Date().toISOString().slice(0, 10)})
    RETURNING *
  `;
  return toClient(row);
}

// ---- Attendance --------------------------------------------------------------
export async function listAttendanceForUser(userId) {
  await ensureReady();
  const sql = getSql();
  return sql`
    SELECT *, check_in AS "checkIn", check_out AS "checkOut"
    FROM attendance WHERE user_id = ${Number(userId)} ORDER BY date DESC
  `;
}
export async function listAllAttendance() {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT a.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
           u.department AS u_department, u.position AS u_position, u.join_date AS u_join_date
    FROM attendance a JOIN users u ON u.id = a.user_id
    ORDER BY a.date DESC
  `;
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, date: r.date, checkIn: r.check_in, checkOut: r.check_out, status: r.status,
    user: { id: r.u_id, name: r.u_name, email: r.u_email, role: r.u_role, department: r.u_department, position: r.u_position, joinDate: r.u_join_date },
  }));
}
export async function getTodayAttendance(userId) {
  await ensureReady();
  const sql = getSql();
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await sql`SELECT * FROM attendance WHERE user_id = ${Number(userId)} AND date = ${today}`;
  if (!row) return null;
  return { id: row.id, userId: row.user_id, date: row.date, checkIn: row.check_in, checkOut: row.check_out, status: row.status };
}
export async function clockIn(userId) {
  await ensureReady();
  const sql = getSql();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const effectiveDeadline = await getEffectiveCheckInDeadline(today);
  const [deadlineH, deadlineM] = effectiveDeadline.split(":").map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const deadlineMinutes = deadlineH * 60 + (deadlineM || 0);
  const status = nowMinutes > deadlineMinutes ? "late" : "present";
  const existing = await getTodayAttendance(userId);
  if (existing) {
    const [row] = await sql`
      UPDATE attendance SET check_in = ${time}, status = ${status} WHERE id = ${existing.id} RETURNING *
    `;
    return row;
  }
  const [row] = await sql`
    INSERT INTO attendance (user_id, date, check_in, check_out, status)
    VALUES (${Number(userId)}, ${today}, ${time}, NULL, ${status})
    RETURNING *
  `;
  return row;
}
export async function clockOut(userId) {
  await ensureReady();
  const sql = getSql();
  const existing = await getTodayAttendance(userId);
  if (!existing) return null;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const [row] = await sql`UPDATE attendance SET check_out = ${time} WHERE id = ${existing.id} RETURNING *`;
  return row;
}

// ---- Salary ------------------------------------------------------------------
export async function listSalaryForUser(userId) {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT *, month_label AS "monthLabel", net_pay AS "netPay", pay_date AS "payDate"
    FROM salary_slips WHERE user_id = ${Number(userId)}
    ORDER BY year DESC, month DESC
  `;
  return rows;
}
export async function listAllSalary() {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT s.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
           u.department AS u_department, u.position AS u_position, u.join_date AS u_join_date
    FROM salary_slips s JOIN users u ON u.id = s.user_id
    ORDER BY s.year DESC, s.month DESC
  `;
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, month: r.month, monthLabel: r.month_label, year: r.year,
    basic: r.basic, allowances: r.allowances, deductions: r.deductions, netPay: r.net_pay,
    status: r.status, payDate: r.pay_date,
    user: { id: r.u_id, name: r.u_name, email: r.u_email, role: r.u_role, department: r.u_department, position: r.u_position, joinDate: r.u_join_date },
  }));
}
export async function addSalarySlip(data) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO salary_slips (user_id, month, month_label, year, basic, allowances, deductions, net_pay, status, pay_date)
    VALUES (${data.userId}, ${data.month}, ${data.monthLabel}, ${data.year}, ${data.basic}, ${data.allowances || 0}, ${data.deductions || 0}, ${data.netPay}, 'pending', ${data.payDate})
    RETURNING *
  `;
  return row;
}
export async function updateSalaryStatus(id, status) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`UPDATE salary_slips SET status = ${status} WHERE id = ${Number(id)} RETURNING *`;
  return row;
}

// ---- Announcements -------------------------------------------------------------
export async function listAnnouncements() {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT *, posted_by AS "postedBy", posted_at AS "postedAt"
    FROM announcements ORDER BY posted_at DESC, id DESC
  `;
  return rows;
}
export async function addAnnouncement({ title, body, priority, postedBy }) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO announcements (title, body, priority, posted_by, posted_at)
    VALUES (${title}, ${body}, ${priority || "normal"}, ${postedBy}, ${new Date().toISOString().slice(0, 10)})
    RETURNING *
  `;
  return row;
}
export async function deleteAnnouncement(id) {
  await ensureReady();
  const sql = getSql();
  await sql`DELETE FROM announcements WHERE id = ${Number(id)}`;
}

// ---- Leave ---------------------------------------------------------------------
export async function listLeaveForUser(userId) {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT *, start_date AS "startDate", end_date AS "endDate", applied_on AS "appliedOn", review_note AS "reviewNote"
    FROM leave_requests WHERE user_id = ${Number(userId)} ORDER BY applied_on DESC, id DESC
  `;
  return rows;
}
export async function listAllLeave() {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT l.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
           u.department AS u_department, u.position AS u_position, u.join_date AS u_join_date
    FROM leave_requests l JOIN users u ON u.id = l.user_id
    ORDER BY l.applied_on DESC, l.id DESC
  `;
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, type: r.type, startDate: r.start_date, endDate: r.end_date,
    days: r.days, reason: r.reason, status: r.status, appliedOn: r.applied_on, reviewNote: r.review_note,
    user: { id: r.u_id, name: r.u_name, email: r.u_email, role: r.u_role, department: r.u_department, position: r.u_position, joinDate: r.u_join_date },
  }));
}
export async function addLeaveRequest(data) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO leave_requests (user_id, type, start_date, end_date, days, reason, status, applied_on, review_note)
    VALUES (${data.userId}, ${data.type}, ${data.startDate}, ${data.endDate}, ${data.days}, ${data.reason || ""}, 'pending', ${new Date().toISOString().slice(0, 10)}, '')
    RETURNING *
  `;
  return row;
}
// ---- Leave types + balances --------------------------------------------------
export async function listLeaveTypes() {
  await ensureReady();
  const sql = getSql();
  return sql`SELECT id, name, label, quota_days AS "quotaDays" FROM leave_types ORDER BY id`;
}
export async function addLeaveType(name, label, quotaDays) {
  await ensureReady();
  const sql = getSql();
  const slug = name.trim().toLowerCase().replace(/\s+/g, "_");
  const [row] = await sql`
    INSERT INTO leave_types (name, label, quota_days) VALUES (${slug}, ${label || name}, ${quotaDays === "" || quotaDays == null ? null : Number(quotaDays)})
    RETURNING id, name, label, quota_days AS "quotaDays"
  `;
  return row;
}
export async function updateLeaveType(id, label, quotaDays) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    UPDATE leave_types SET label = COALESCE(${label ?? null}, label), quota_days = ${quotaDays === "" || quotaDays == null ? null : Number(quotaDays)}
    WHERE id = ${Number(id)}
    RETURNING id, name, label, quota_days AS "quotaDays"
  `;
  return row;
}
export async function deleteLeaveType(id) {
  await ensureReady();
  const sql = getSql();
  await sql`DELETE FROM leave_types WHERE id = ${Number(id)}`;
}
export async function getLeaveBalanceForUser(userId, year) {
  await ensureReady();
  const sql = getSql();
  const y = year || new Date().getFullYear();
  const types = await sql`SELECT id, name, label, quota_days AS "quotaDays" FROM leave_types ORDER BY id`;
  const used = await sql`
    SELECT type, COALESCE(SUM(days), 0)::int AS used
    FROM leave_requests
    WHERE user_id = ${Number(userId)} AND status = 'approved' AND EXTRACT(YEAR FROM start_date) = ${y}
    GROUP BY type
  `;
  const usedMap = Object.fromEntries(used.map((u) => [u.type, u.used]));
  return types.map((t) => {
    const usedDays = usedMap[t.name] || 0;
    return {
      type: t.name,
      label: t.label,
      quota: t.quotaDays,
      used: usedDays,
      remaining: t.quotaDays == null ? null : Math.max(0, t.quotaDays - usedDays),
    };
  });
}
export async function listCompanyLeaveCalendar() {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT l.id, l.type, l.start_date AS "startDate", l.end_date AS "endDate", l.status,
           u.id AS "userId", u.name AS "userName", u.department
    FROM leave_requests l JOIN users u ON u.id = l.user_id
    WHERE l.status IN ('approved', 'pending') AND l.end_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY l.start_date ASC
  `;
  return rows;
}
export async function updateLeaveStatus(id, status, reviewNote) {
  await ensureReady();
  const sql = getSql();
  const note = reviewNote ?? null;
  const [row] = await sql`
    UPDATE leave_requests SET status = ${status}, review_note = COALESCE(${note}, review_note)
    WHERE id = ${Number(id)} RETURNING *
  `;
  return row;
}

// ---- Service requests (cash advance, admin services) ----------------------------
export async function listServicesForUser(userId) {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT *, applied_on AS "appliedOn", review_note AS "reviewNote"
    FROM service_requests WHERE user_id = ${Number(userId)} ORDER BY applied_on DESC, id DESC
  `;
  return rows;
}
export async function listAllServices() {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT s.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
           u.department AS u_department, u.position AS u_position, u.join_date AS u_join_date
    FROM service_requests s JOIN users u ON u.id = s.user_id
    ORDER BY s.applied_on DESC, s.id DESC
  `;
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, type: r.type, amount: r.amount, details: r.details,
    status: r.status, appliedOn: r.applied_on, reviewNote: r.review_note,
    user: { id: r.u_id, name: r.u_name, email: r.u_email, role: r.u_role, department: r.u_department, position: r.u_position, joinDate: r.u_join_date },
  }));
}
export async function addServiceRequest(data) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO service_requests (user_id, type, amount, details, status, applied_on, review_note)
    VALUES (${data.userId}, ${data.type}, ${data.amount ?? null}, ${data.details}, 'pending', ${new Date().toISOString().slice(0, 10)}, '')
    RETURNING *
  `;
  return row;
}
export async function updateServiceStatus(id, status, reviewNote) {
  await ensureReady();
  const sql = getSql();
  const note = reviewNote ?? null;
  const [row] = await sql`
    UPDATE service_requests SET status = ${status}, review_note = COALESCE(${note}, review_note)
    WHERE id = ${Number(id)} RETURNING *
  `;
  return row;
}

// ---- Appraisals -------------------------------------------------------------------
export async function listAppraisalsForUser(userId) {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT *, self_rating AS "selfRating", manager_rating AS "managerRating", due_date AS "dueDate"
    FROM appraisals WHERE user_id = ${Number(userId)}
  `;
  return rows;
}
export async function listAllAppraisals() {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT a.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
           u.department AS u_department, u.position AS u_position, u.join_date AS u_join_date
    FROM appraisals a JOIN users u ON u.id = a.user_id
  `;
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, cycle: r.cycle, status: r.status, selfRating: r.self_rating,
    managerRating: r.manager_rating, goals: r.goals, feedback: r.feedback, dueDate: r.due_date,
    user: { id: r.u_id, name: r.u_name, email: r.u_email, role: r.u_role, department: r.u_department, position: r.u_position, joinDate: r.u_join_date },
  }));
}
export async function addAppraisal(data) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO appraisals (user_id, cycle, status, goals, due_date)
    VALUES (${data.userId}, ${data.cycle}, ${data.status || "not_started"}, ${data.goals || ""}, ${data.dueDate || null})
    RETURNING *
  `;
  return row;
}
export async function updateAppraisal(id, patch) {
  await ensureReady();
  const sql = getSql();
  const [current] = await sql`SELECT * FROM appraisals WHERE id = ${Number(id)}`;
  if (!current) return null;
  const merged = {
    self_rating: patch.selfRating !== undefined ? patch.selfRating : current.self_rating,
    manager_rating: patch.managerRating !== undefined ? patch.managerRating : current.manager_rating,
    feedback: patch.feedback !== undefined ? patch.feedback : current.feedback,
    status: patch.status !== undefined ? patch.status : current.status,
  };
  const [row] = await sql`
    UPDATE appraisals SET self_rating = ${merged.self_rating}, manager_rating = ${merged.manager_rating},
      feedback = ${merged.feedback}, status = ${merged.status}
    WHERE id = ${Number(id)} RETURNING *
  `;
  return row;
}

// ---- Company settings ---------------------------------------------------------
export async function getSettings() {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`SELECT * FROM company_settings WHERE id = 1`;
  return {
    checkInDeadline: row?.check_in_deadline || "08:30",
    workingHours: row ? Number(row.working_hours) : 6,
    weekendDays: (row?.weekend_days || "5,6").split(",").map(Number),
    workStartTime: row?.work_start_time || "08:00",
    workEndTime: row?.work_end_time || "14:00",
    lateDeductionPerDay: row ? Number(row.late_deduction_per_day) : 0,
  };
}
export async function updateSettings({ checkInDeadline, workingHours, weekendDays, workStartTime, workEndTime, lateDeductionPerDay }) {
  await ensureReady();
  const sql = getSql();
  const weekendStr = Array.isArray(weekendDays) ? weekendDays.join(",") : null;
  const [row] = await sql`
    UPDATE company_settings
    SET check_in_deadline = COALESCE(${checkInDeadline ?? null}, check_in_deadline),
        working_hours = COALESCE(${workingHours ?? null}, working_hours),
        weekend_days = COALESCE(${weekendStr}, weekend_days),
        work_start_time = COALESCE(${workStartTime ?? null}, work_start_time),
        work_end_time = COALESCE(${workEndTime ?? null}, work_end_time),
        late_deduction_per_day = COALESCE(${lateDeductionPerDay ?? null}, late_deduction_per_day),
        updated_at = now()
    WHERE id = 1
    RETURNING *
  `;
  return {
    checkInDeadline: row.check_in_deadline,
    workingHours: Number(row.working_hours),
    weekendDays: row.weekend_days.split(",").map(Number),
    workStartTime: row.work_start_time,
    workEndTime: row.work_end_time,
    lateDeductionPerDay: Number(row.late_deduction_per_day),
  };
}

// ---- Late-day tracking (for payroll pay-cut calculation) ------------------------
export async function countLateDays(userId, month, year) {
  await ensureReady();
  const sql = getSql();
  const m = String(Number(month)).padStart(2, "0");
  const y = String(Number(year));
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM attendance
    WHERE user_id = ${Number(userId)} AND status = 'late'
      AND to_char(date, 'YYYY-MM') = ${`${y}-${m}`}
  `;
  return rows[0]?.count || 0;
}

// ---- Organization structure: departments / sections / units ---------------------
export async function listOrgStructure() {
  await ensureReady();
  const sql = getSql();
  const [departments, sections, units, deptCounts, unitCounts] = await Promise.all([
    sql`SELECT * FROM departments ORDER BY name ASC`,
    sql`SELECT * FROM sections ORDER BY name ASC`,
    sql`SELECT * FROM units ORDER BY name ASC`,
    sql`SELECT department, COUNT(*)::int AS count FROM users WHERE role = 'employee' GROUP BY department`,
    sql`SELECT department, unit, COUNT(*)::int AS count FROM users WHERE role = 'employee' AND unit IS NOT NULL GROUP BY department, unit`,
  ]);
  const countFor = (name) => deptCounts.find((c) => (c.department || "").trim().toLowerCase() === (name || "").trim().toLowerCase())?.count || 0;
  const unitCountFor = (deptName, unitName) =>
    unitCounts.find(
      (c) => (c.department || "").trim().toLowerCase() === (deptName || "").trim().toLowerCase()
        && (c.unit || "").trim().toLowerCase() === (unitName || "").trim().toLowerCase()
    )?.count || 0;
  return departments.map((d) => ({
    id: d.id,
    name: d.name,
    employeeCount: countFor(d.name),
    sections: sections
      .filter((s) => s.department_id === d.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        departmentId: s.department_id,
        units: units.filter((u) => u.section_id === s.id).map((u) => ({ id: u.id, name: u.name, sectionId: u.section_id, employeeCount: unitCountFor(d.name, u.name) })),
      })),
  }));
}
export async function addDepartment(name) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`INSERT INTO departments (name) VALUES (${name}) RETURNING *`;
  return row;
}
export async function renameDepartment(id, name) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`UPDATE departments SET name = ${name} WHERE id = ${Number(id)} RETURNING *`;
  return row;
}
export async function deleteDepartment(id) {
  await ensureReady();
  const sql = getSql();
  await sql`DELETE FROM departments WHERE id = ${Number(id)}`;
}
export async function addSection(departmentId, name) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`INSERT INTO sections (department_id, name) VALUES (${Number(departmentId)}, ${name}) RETURNING *`;
  return row;
}
export async function renameSection(id, name) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`UPDATE sections SET name = ${name} WHERE id = ${Number(id)} RETURNING *`;
  return row;
}
export async function deleteSection(id) {
  await ensureReady();
  const sql = getSql();
  await sql`DELETE FROM sections WHERE id = ${Number(id)}`;
}
export async function addUnit(sectionId, name) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`INSERT INTO units (section_id, name) VALUES (${Number(sectionId)}, ${name}) RETURNING *`;
  return row;
}
export async function renameUnit(id, name) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`UPDATE units SET name = ${name} WHERE id = ${Number(id)} RETURNING *`;
  return row;
}
export async function deleteUnit(id) {
  await ensureReady();
  const sql = getSql();
  await sql`DELETE FROM units WHERE id = ${Number(id)}`;
}

// ---- Holidays / working calendar -------------------------------------------------
export async function listHolidays() {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT *, start_date AS "startDate", end_date AS "endDate",
           adjusted_start_time AS "adjustedStartTime", adjusted_end_time AS "adjustedEndTime"
    FROM holidays ORDER BY start_date ASC
  `;
  return rows;
}
export async function addHoliday({ name, startDate, endDate, type, adjustedStartTime, adjustedEndTime }) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO holidays (name, start_date, end_date, type, adjusted_start_time, adjusted_end_time)
    VALUES (${name}, ${startDate}, ${endDate || startDate}, ${type || "holiday"}, ${adjustedStartTime ?? null}, ${adjustedEndTime ?? null})
    RETURNING *
  `;
  return row;
}

// Returns the effective check-in deadline for a given date, honoring any active
// adjusted-hours calendar entry (e.g. Ramadan 9:00am-1:30pm) instead of the
// standard company-wide deadline. Salary/payout logic is untouched by this -
// it only affects the "late" flag on attendance.
export async function getEffectiveCheckInDeadline(dateStr) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    SELECT adjusted_start_time AS "adjustedStartTime"
    FROM holidays
    WHERE ${dateStr} BETWEEN start_date AND end_date AND adjusted_start_time IS NOT NULL
    ORDER BY id DESC LIMIT 1
  `;
  if (row?.adjustedStartTime) {
    const [h, m] = row.adjustedStartTime.split(":").map(Number);
    const graceMinutes = h * 60 + (m || 0) + 30;
    return `${String(Math.floor(graceMinutes / 60)).padStart(2, "0")}:${String(graceMinutes % 60).padStart(2, "0")}`;
  }
  const settings = await getSettings();
  return settings.checkInDeadline;
}
// Returns the effective working hours for a given date, honoring any active
// adjusted-hours calendar entry (Ramadan, or a one-off shortened day like a
// staff event) instead of the standard company-wide hours.
export async function getEffectiveWorkHours(dateStr) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    SELECT name, adjusted_start_time AS "adjustedStartTime", adjusted_end_time AS "adjustedEndTime"
    FROM holidays
    WHERE ${dateStr} BETWEEN start_date AND end_date AND adjusted_start_time IS NOT NULL
    ORDER BY id DESC LIMIT 1
  `;
  const settings = await getSettings();
  return {
    start: row?.adjustedStartTime || settings.workStartTime,
    end: row?.adjustedEndTime || settings.workEndTime,
    label: row?.adjustedStartTime ? row.name : null,
  };
}
export async function deleteHoliday(id) {
  await ensureReady();
  const sql = getSql();
  await sql`DELETE FROM holidays WHERE id = ${Number(id)}`;
}

// ---- Salary (lookup) -----------------------------------------------------------
export async function getSalarySlipById(id) {
  await ensureReady();
  const sql = getSql();
  const [r] = await sql`
    SELECT s.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
           u.department AS u_department, u.position AS u_position, u.join_date AS u_join_date
    FROM salary_slips s JOIN users u ON u.id = s.user_id
    WHERE s.id = ${Number(id)}
  `;
  if (!r) return null;
  return {
    id: r.id, userId: r.user_id, month: r.month, monthLabel: r.month_label, year: r.year,
    basic: r.basic, allowances: r.allowances, deductions: r.deductions, netPay: r.net_pay,
    status: r.status, payDate: r.pay_date,
    user: { id: r.u_id, name: r.u_name, email: r.u_email, role: r.u_role, department: r.u_department, position: r.u_position, joinDate: r.u_join_date },
  };
}

// ---- Time change requests -------------------------------------------------------
export async function listTimeChangeForUser(userId) {
  await ensureReady();
  const sql = getSql();
  return sql`
    SELECT *, attendance_id AS "attendanceId", current_check_in AS "currentCheckIn",
           requested_check_in AS "requestedCheckIn", applied_on AS "appliedOn", review_note AS "reviewNote"
    FROM time_change_requests WHERE user_id = ${Number(userId)} ORDER BY applied_on DESC, id DESC
  `;
}
export async function listAllTimeChange() {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT t.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
           u.department AS u_department, u.position AS u_position, u.join_date AS u_join_date
    FROM time_change_requests t JOIN users u ON u.id = t.user_id
    ORDER BY t.applied_on DESC, t.id DESC
  `;
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, attendanceId: r.attendance_id, date: r.date,
    currentCheckIn: r.current_check_in, requestedCheckIn: r.requested_check_in, reason: r.reason,
    status: r.status, appliedOn: r.applied_on, reviewNote: r.review_note,
    user: { id: r.u_id, name: r.u_name, email: r.u_email, role: r.u_role, department: r.u_department, position: r.u_position, joinDate: r.u_join_date },
  }));
}
export async function addTimeChangeRequest(data) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO time_change_requests (user_id, attendance_id, date, current_check_in, requested_check_in, reason, status, applied_on, review_note)
    VALUES (${data.userId}, ${data.attendanceId}, ${data.date}, ${data.currentCheckIn ?? null}, ${data.requestedCheckIn}, ${data.reason || ""}, 'pending', ${new Date().toISOString().slice(0, 10)}, '')
    RETURNING *
  `;
  return row;
}
export async function updateTimeChangeStatus(id, status, reviewNote) {
  await ensureReady();
  const sql = getSql();
  const note = reviewNote ?? null;
  const [row] = await sql`
    UPDATE time_change_requests SET status = ${status}, review_note = COALESCE(${note}, review_note)
    WHERE id = ${Number(id)} RETURNING *
  `;
  if (row && status === "approved") {
    await sql`
      UPDATE attendance SET check_in = ${row.requested_check_in}, status = 'present'
      WHERE id = ${row.attendance_id}
    `;
  }
  return row;
}

// ---- HR onboarding ---------------------------------------------------------------
export async function onboardEmployee({ name, email, password, department, position, role, unit, nationalId, phone, emergencyContactName, emergencyContactPhone, reportsTo }) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO users (name, email, password_hash, role, department, position, join_date, unit, national_id, phone, emergency_contact_name, emergency_contact_phone, reports_to)
    VALUES (${name}, ${email}, ${bcrypt.hashSync(password, 8)}, ${role || "employee"}, ${department || "General"}, ${position || "Employee"}, ${new Date().toISOString().slice(0, 10)}, ${unit ?? null}, ${nationalId ?? null}, ${phone ?? null}, ${emergencyContactName ?? null}, ${emergencyContactPhone ?? null}, ${reportsTo ? Number(reportsTo) : null})
    RETURNING *
  `;
  return toClient(row);
}

// ---- Reporting workflow ------------------------------------------------------
export async function countDirectReports(managerId) {
  await ensureReady();
  const sql = getSql();
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM users WHERE reports_to = ${Number(managerId)}`;
  return count;
}
export async function listDirectReports(managerId) {
  await ensureReady();
  const sql = getSql();
  return sql`SELECT id, name, email, department, position FROM users WHERE reports_to = ${Number(managerId)} ORDER BY name`;
}
export async function listLeaveForManager(managerId) {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT l.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
           u.department AS u_department, u.position AS u_position, u.join_date AS u_join_date
    FROM leave_requests l JOIN users u ON u.id = l.user_id
    WHERE u.reports_to = ${Number(managerId)}
    ORDER BY l.applied_on DESC, l.id DESC
  `;
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, type: r.type, startDate: r.start_date, endDate: r.end_date,
    days: r.days, reason: r.reason, status: r.status, appliedOn: r.applied_on, reviewNote: r.review_note,
    user: { id: r.u_id, name: r.u_name, email: r.u_email, role: r.u_role, department: r.u_department, position: r.u_position, joinDate: r.u_join_date },
  }));
}
export async function listTimeChangeForManager(managerId) {
  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT t.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
           u.department AS u_department, u.position AS u_position, u.join_date AS u_join_date
    FROM time_change_requests t JOIN users u ON u.id = t.user_id
    WHERE u.reports_to = ${Number(managerId)}
    ORDER BY t.applied_on DESC, t.id DESC
  `;
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, attendanceId: r.attendance_id, date: r.date,
    currentCheckIn: r.current_check_in, requestedCheckIn: r.requested_check_in, reason: r.reason,
    status: r.status, appliedOn: r.applied_on, reviewNote: r.review_note,
    user: { id: r.u_id, name: r.u_name, email: r.u_email, role: r.u_role, department: r.u_department, position: r.u_position, joinDate: r.u_join_date },
  }));
}
export async function canReviewLeaveRequest(reviewerId, leaveId) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    SELECT u.reports_to AS "reportsTo" FROM leave_requests l JOIN users u ON u.id = l.user_id WHERE l.id = ${Number(leaveId)}
  `;
  return !!row && Number(row.reportsTo) === Number(reviewerId);
}
export async function canReviewTimeChangeRequest(reviewerId, requestId) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    SELECT u.reports_to AS "reportsTo" FROM time_change_requests t JOIN users u ON u.id = t.user_id WHERE t.id = ${Number(requestId)}
  `;
  return !!row && Number(row.reportsTo) === Number(reviewerId);
}

// ---- Employee profile: photo + documents -----------------------------------------
export async function updateEmployeePhoto(userId, photoDataUrl) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`UPDATE users SET photo = ${photoDataUrl} WHERE id = ${Number(userId)} RETURNING *`;
  return toClient(row);
}
export async function listEmployeeDocuments(userId) {
  await ensureReady();
  const sql = getSql();
  return sql`
    SELECT id, user_id AS "userId", name, doc_type AS "docType", mime_type AS "mimeType", uploaded_at AS "uploadedAt"
    FROM employee_documents WHERE user_id = ${Number(userId)} ORDER BY uploaded_at DESC
  `;
}
export async function getEmployeeDocument(id) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`SELECT * FROM employee_documents WHERE id = ${Number(id)}`;
  return row;
}
export async function addEmployeeDocument({ userId, name, docType, fileData, mimeType }) {
  await ensureReady();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO employee_documents (user_id, name, doc_type, mime_type, file_data)
    VALUES (${Number(userId)}, ${name}, ${docType || "other"}, ${mimeType ?? null}, ${fileData})
    RETURNING id, user_id AS "userId", name, doc_type AS "docType", mime_type AS "mimeType", uploaded_at AS "uploadedAt"
  `;
  return row;
}
export async function deleteEmployeeDocument(id) {
  await ensureReady();
  const sql = getSql();
  await sql`DELETE FROM employee_documents WHERE id = ${Number(id)}`;
}

export function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.passwordHash);
}
