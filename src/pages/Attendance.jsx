
import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Save,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { supabase } from "../lib/superbase";

const STATUSES = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function getStudentName(student) {
  return (
    student.full_name ||
    [student.first_name, student.last_name].filter(Boolean).join(" ") ||
    student.name ||
    "Unnamed student"
  );
}

function Attendance() {
  const [attendanceDate, setAttendanceDate] = useState(getLocalDate());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [schoolId, setSchoolId] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load the logged-in user's profile and assigned classes.
  const loadAccess = useCallback(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      throw new Error("Please log in to manage attendance.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, school_id, role, status")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    if (
      !profile.school_id ||
      profile.status !== "active" ||
      !["school_admin", "teacher"].includes(profile.role)
    ) {
      throw new Error("You are not authorized to manage attendance.");
    }

    let classes = [];

    if (profile.role === "teacher") {
      const { data, error: assignmentError } = await supabase
        .from("teacher_class_assignments")
        .select("class_name")
        .eq("teacher_id", user.id)
        .eq("school_id", profile.school_id);

      if (assignmentError) throw assignmentError;

      classes = [
        ...new Set(
          (data || [])
            .map((item) => item.class_name?.trim())
            .filter(Boolean)
        ),
      ];
    }

    return {
      user,
      profile,
      classes,
    };
  }, []);

  // Load students and attendance for the selected class and date.
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { user, profile, classes } = await loadAccess();

      setSchoolId(profile.school_id);
      setStaffId(user.id);
      setUserRole(profile.role);
      setAssignedClasses(classes);

      let activeClass = selectedClass;

      if (profile.role === "teacher") {
        if (classes.length === 0) {
          setSelectedClass("");
          setStudents([]);
          setAttendance({});
          setError(
            "You have not been assigned to any class. Please contact your school administrator."
          );
          return;
        }

        if (!classes.includes(activeClass)) {
          activeClass = classes[0];
          setSelectedClass(activeClass);
        }
      } else {
        activeClass = "";
      }

      let query = supabase
        .from("students")
        .select("*")
        .eq("school_id", profile.school_id)
        .order("created_at", { ascending: true });

      if (profile.role === "teacher") {
        query = query.eq("class_name", activeClass);
      }

      const { data: studentRows, error: studentsError } = await query;

      if (studentsError) throw studentsError;

      const studentList = studentRows || [];
      setStudents(studentList);

      if (studentList.length === 0) {
        setAttendance({});
        return;
      }

      const studentIds = studentList.map((student) => student.id);

      const { data: savedRows, error: attendanceError } = await supabase
        .from("attendance")
        .select("student_id, status, remarks")
        .eq("school_id", profile.school_id)
        .eq("attendance_date", attendanceDate)
        .in("student_id", studentIds);

      if (attendanceError) throw attendanceError;

      const savedMap = {};

      (savedRows || []).forEach((row) => {
        savedMap[row.student_id] = {
          status: row.status,
          remarks: row.remarks || "",
        };
      });

      setAttendance(savedMap);
    } catch (err) {
      console.error("Unable to load attendance:", err);
      setError(err.message || "Unable to load attendance.");
      setStudents([]);
      setAttendance({});
    } finally {
      setLoading(false);
    }
  }, [attendanceDate, selectedClass, loadAccess]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  function updateStatus(studentId, status) {
    setAttendance((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        status,
        remarks: current[studentId]?.remarks || "",
      },
    }));
    setMessage("");
  }

  function updateRemarks(studentId, remarks) {
    setAttendance((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        remarks,
      },
    }));
    setMessage("");
  }

  async function saveAttendance() {
    setError("");
    setMessage("");

    if (!schoolId || !staffId || !userRole) {
      setError("School information is missing. Please reload the page.");
      return;
    }

    const markedStudents = students.filter(
      (student) => attendance[student.id]?.status
    );

    if (markedStudents.length === 0) {
      setError("Please mark at least one student's attendance first.");
      return;
    }

    setSaving(true);

    try {
      // Verify teacher assignments again before saving.
      if (userRole === "teacher") {
        const { data: assignments, error: assignmentError } =
          await supabase
            .from("teacher_class_assignments")
            .select("class_name")
            .eq("teacher_id", staffId)
            .eq("school_id", schoolId);

        if (assignmentError) throw assignmentError;

        const allowedClasses = new Set(
          (assignments || [])
            .map((item) => item.class_name?.trim())
            .filter(Boolean)
        );

        if (!selectedClass || !allowedClasses.has(selectedClass)) {
          throw new Error(
            "You are not assigned to the selected class."
          );
        }

        if (
          markedStudents.some(
            (student) =>
              student.class_name?.trim() !== selectedClass
          )
        ) {
          throw new Error(
            "You can only mark students in your selected assigned class."
          );
        }
      }

      const rows = markedStudents.map((student) => ({
        school_id: schoolId,
        student_id: student.id,
        attendance_date: attendanceDate,
        status: attendance[student.id].status,
        remarks: attendance[student.id].remarks?.trim() || null,
        marked_by: staffId,
        updated_at: new Date().toISOString(),
      }));

      const { error: saveError } = await supabase
        .from("attendance")
        .upsert(rows, {
          onConflict: "student_id,attendance_date",
        });

      if (saveError) throw saveError;

      setMessage(
        `Attendance saved successfully for ${markedStudents.length} student(s).`
      );

      await loadAttendance();
    } catch (err) {
      console.error("Unable to save attendance:", err);
      setError(
        err.message ||
          "Unable to save attendance. Check your Supabase permissions."
      );
    } finally {
      setSaving(false);
    }
  }

  const countStatus = (status) =>
    students.filter(
      (student) => attendance[student.id]?.status === status
    ).length;

  const markedCount = students.filter(
    (student) => attendance[student.id]?.status
  ).length;

  const statistics = [
    {
      label: "Present",
      count: countStatus("present"),
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Absent",
      count: countStatus("absent"),
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Late",
      count: countStatus("late"),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Excused",
      count: countStatus("excused"),
      icon: ShieldCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={
          userRole === "teacher"
            ? "Record attendance for your assigned classes."
            : "Record and review your school's daily attendance."
        }
      />

      {userRole === "teacher" && assignedClasses.length > 0 && (
        <section className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-bold text-blue-950">
            My Assigned Classes
          </h2>
          <p className="mt-1 text-sm text-blue-700">
            Select a class to view and mark its students.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {assignedClasses.map((className) => (
              <button
                key={className}
                type="button"
                onClick={() => setSelectedClass(className)}
                disabled={saving}
                aria-pressed={selectedClass === className}
                className={`rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  selectedClass === className
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-100"
                }`}
              >
                {className}
              </button>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div
                className={`inline-flex rounded-xl p-3 ${item.bg} ${item.color}`}
              >
                <Icon size={22} />
              </div>
              <p className="mt-4 text-sm text-gray-500">{item.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">
                {item.count}
              </p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <CalendarCheck size={22} />
            </span>
            <div>
              <h2 className="font-bold text-gray-900">
                {userRole === "teacher" && selectedClass
                  ? `${selectedClass} Attendance Register`
                  : "Daily register"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {markedCount} of {students.length} students marked
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={attendanceDate}
              onChange={(event) =>
                setAttendanceDate(event.target.value)
              }
              className="min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <button
              type="button"
              onClick={loadAttendance}
              disabled={loading || saving}
              title="Reload attendance"
              className="rounded-xl border border-gray-200 px-3 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-gray-500">
            <LoaderCircle className="animate-spin" size={22} />
            Loading students and attendance...
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-gray-800">
              No students found
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {userRole === "teacher"
                ? `No students were found in ${selectedClass || "your selected class"}. Check the class assignment and student class names.`
                : "Make sure students have been registered and assigned to your school."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Admission number</th>
                    <th className="px-5 py-4">Attendance status</th>
                    <th className="px-5 py-4">Remarks</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => {
                    const record = attendance[student.id] || {};

                    return (
                      <tr key={student.id}>
                        <td className="px-5 py-4 font-semibold text-gray-800">
                          {getStudentName(student)}
                        </td>

                        <td className="px-5 py-4 text-gray-500">
                          {student.admission_number || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={record.status || ""}
                            onChange={(event) =>
                              updateStatus(
                                student.id,
                                event.target.value
                              )
                            }
                            className="w-36 rounded-lg border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                          >
                            <option value="">Not marked</option>
                            {STATUSES.map((status) => (
                              <option
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <input
                            type="text"
                            value={record.remarks || ""}
                            onChange={(event) =>
                              updateRemarks(
                                student.id,
                                event.target.value
                              )
                            }
                            placeholder="Optional note"
                            maxLength={500}
                            className="w-48 rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Only students with a selected status will be saved.
              </p>

              <button
                type="button"
                onClick={saveAttendance}
                disabled={saving || loading || markedCount === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Saving..." : "Save attendance"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Attendance;
