// backend/scripts/import-all.js
import XLSX from "xlsx";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

import sequelize from "../config/database.js";

import Department from "../models/Department.js";
import Semester from "../models/Semester.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadExcel(fileName) {
  const filePath = path.join(__dirname, "..", "samples", fileName);
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

async function importDepartments() {
  const defaultDepartments = [
    { name: "Computer Science", code: "CS" },
    { name: "Software Engineering", code: "SE" },
    { name: "Electrical Engineering", code: "EE" }
  ];

  for (const dept of defaultDepartments) {
    await Department.findOrCreate({
      where: { code: dept.code },
      defaults: dept
    });
  }
}

async function importSemesters() {
  const semesters = [
    { id: 1, year: 2025, term: "1", start_date: "2025-03-01", end_date: "2025-06-30" },
    { id: 2, year: 2025, term: "2", start_date: "2025-09-01", end_date: "2025-12-20" },
    { id: 3, year: 2025, term: "S", start_date: "2025-07-01", end_date: "2025-08-15" },
    { id: 4, year: 2025, term: "W", start_date: "2025-01-02", end_date: "2025-02-20" }
  ];

  for (const s of semesters) {
    await Semester.findOrCreate({
      where: { id: s.id },
      defaults: s
    });
  }
}

async function importStudents() {
  const rows = loadExcel("test_students.xlsx");

  for (const r of rows) {
    const dept = await Department.findOne({ where: { code: r.department_code } });
    if (!dept) continue;

    const hashed = await bcrypt.hash(String(r.password), 10);

    await User.findOrCreate({
      where: { email: r.email },
      defaults: {
        role: r.role,
        name: r.name,
        email: r.email,
        password_hash: hashed,
        student_id: r.student_id || null,
        department_id: dept.id
      }
    });
  }
}

async function createMissingInstructors() {
  let rows = [];

  try {
    rows = loadExcel("test_instructors.xlsx");
  } catch {
    console.log("⚠️ test_instructors.xlsx 없음, instructor 생성 생략");
    return;
  }

  for (const r of rows) {
    const dept = await Department.findOne({ where: { code: r.department_code } });
    if (!dept) continue;

    const hashed = await bcrypt.hash(String(r.password), 10);

    await User.findOrCreate({
      where: { email: r.email },
      defaults: {
        role: r.role,
        name: r.name,
        email: r.email,
        password_hash: hashed,
        student_id: null,
        department_id: dept.id
      }
    });
  }
}

async function createAdminIfNotExists() {
  const hashed = await bcrypt.hash("1234", 10);

  await User.findOrCreate({
    where: { email: "admin@school.edu" },
    defaults: {
      role: "Admin",
      name: "System Admin",
      email: "admin@school.edu",
      password_hash: hashed,
      department_id: 1
    }
  });

  console.log("✔ Admin 생성 완료 (admin@school.edu / 1234)");
}

async function importCourses() {
  const rows = loadExcel("test_courses.xlsx");

  for (const r of rows) {
    const instructor = await User.findOne({ where: { email: r.instructor_email } });
    const dept = await Department.findOne({ where: { code: r.department_code } });

    if (!instructor || !dept) continue;

    await Course.findOrCreate({
      where: {
        code: r.code,
        section: r.section
      },
      defaults: {
        title: r.title,
        code: r.code,
        section: r.section,
        instructor_id: instructor.id,
        semester_id: r.semester_id,
        department_id: dept.id,
        room: r.room,
        duration_hours: r.duration_hours,
        duration_minutes: r.duration_minutes
      }
    });
  }
}

async function importEnrollments() {
  const rows = loadExcel("sample_enrollments.xlsx");

  for (const r of rows) {
    const student = await User.findOne({ where: { student_id: r.student_id } });
    if (!student) continue;

    await Enrollment.findOrCreate({
      where: {
        course_id: r.course_id,
        user_id: student.id
      },
      defaults: {
        course_id: r.course_id,
        user_id: student.id,
        role: r.role,
        enrolled_at: new Date()
      }
    });
  }
}

async function main() {
  try {
    await sequelize.sync();

    await importDepartments();
    await importSemesters();
    await importStudents();
    await createMissingInstructors();
    await createAdminIfNotExists(); // ⭐ 추가됨
    await importCourses();
    await importEnrollments();

    console.log("🎯 데이터 import 완료");
    process.exit(0);
  } catch (err) {
    console.error("❌ Import error:", err);
    process.exit(1);
  }
}

main();
