
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/superbase";

export default function StudentAttendance() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttendance() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        navigate("/student-login", { replace: true });
        return;
      }

      // Get the logged-in student's record.
      // full_name is not a column in the students table.
      const { data: studentData, error: studentError } =
        await supabase
          .from("students")
          .select(
            "id, school_id, first_name, middle_name, last_name, admission_number, class_name, auth_user_id"
          )
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        throw new Error(
          "Your student record was not found. Please contact your school administrator."
        );
      }

      setStudent(studentData);

      // Load attendance for this student and school.
      const { data: attendanceData, error: attendanceError } =
        await supabase
          .from("attendance")
          .select(
            "id, school_id, student_id, attendance_date, status, remarks"
          )
          .eq("student_id", studentData.id)
          .eq("school_id", studentData.school_id)
          .order("attendance_date", { ascending: false });

      if (attendanceError) throw attendanceError;

      setAttendance(attendanceData || []);
    } catch (err) {
      console.error("Unable to load student attendance:", err);
      setError(err.message || "Unable to load attendance records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeStatus = (status) =>
    String(status || "").trim().toLowerCase();

  const presentCount = attendance.filter(
    (record) => normalizeStatus(record.status) === "present"
  ).length;

  const absentCount = attendance.filter(
    (record) => normalizeStatus(record.status) === "absent"
  ).length;

  const lateCount = attendance.filter(
    (record) => normalizeStatus(record.status) === "late"
  ).length;

  const attendancePercentage =
    attendance.length > 0
      ? Math.round((presentCount / attendance.length) * 100)
      : 0;

  const studentName = student
    ? [
        student.first_name,
        student.middle_name,
        student.last_name,
      ]
        .filter(Boolean)
        .join(" ") || "Student"
    : "Student";

  function formatDate(dateString) {
    if (!dateString) return "Date unavailable";

    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function statusStyle(status) {
    switch (normalizeStatus(status)) {
      case "present":
        return "bg-emerald-100 text-emerald-700";
      case "absent":
        return "bg-red-100 text-red-700";
      case "late":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-50 text-slate-600">
        <LoaderCircle
          className="animate-spin text-blue-600"
          size={28}
        />
        Loading attendance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="rounded-xl bg-blue-600 p-2 text-white">
            <GraduationCap size={25} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold">
              Edu<span className="text-blue-600">Portal</span>
            </h1>
            <p className="text-xs text-slate-500">
              Student Attendance
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/student"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <section>
          <p className="text-sm font-semibold text-blue-600">
            ATTENDANCE RECORD
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            My Attendance
          </h2>

          <p className="mt-2 text-slate-500">
            Hello, {studentName}. Here is your recorded attendance history.
          </p>

          {student?.class_name && (
            <p className="mt-1 text-sm text-slate-500">
              Class: {student.class_name}
            </p>
          )}

          {student?.admission_number && (
            <p className="mt-1 text-sm text-slate-500">
              Admission Number: {student.admission_number}
            </p>
          )}
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {error && (
          <button
            onClick={loadAttendance}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw size={17} />
            Try again
          </button>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Records"
            value={attendance.length}
            icon={<CalendarCheck size={23} />}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Present"
            value={presentCount}
            icon={<CheckCircle2 size={23} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Absent"
            value={absentCount}
            icon={<XCircle size={23} />}
            iconClass="bg-red-50 text-red-600"
          />

          <SummaryCard
            title="Late"
            value={lateCount}
            icon={<Clock size={23} />}
            iconClass="bg-amber-50 text-amber-600"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Attendance Percentage
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Based on all attendance records currently available.
              </p>
            </div>

            <p className="text-3xl font-extrabold text-blue-600">
              {attendancePercentage}%
            </p>
          </div>

          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Attendance percentage"
            aria-valuenow={attendancePercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${attendancePercentage}%` }}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-bold text-slate-900">
              Attendance History
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your latest attendance records appear first.
            </p>
          </div>

          {attendance.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarCheck
                size={38}
                className="mx-auto mb-3 text-slate-400"
              />

              <h4 className="font-bold text-slate-800">
                No attendance records yet
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                Your attendance will appear here after your teacher records it.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Remarks</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {attendance.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                        {formatDate(record.attendance_date)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(
                            record.status
                          )}`}
                        >
                          {record.status || "Not specified"}
                        </span>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-slate-600">
                        {record.remarks || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} EduPortal. All rights reserved.
      </footer>
    </div>
  );
}

function SummaryCard({ title, value, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-xl p-3 ${iconClass}`}>
        {icon}
      </div>

      <p className="mt-4 text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}
