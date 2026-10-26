
import { useCallback, useEffect, useState } from "react";
import {
  UserRound,
  BookOpen,
  GraduationCap,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { supabase } from "../lib/superbase";

function getTeacherName(teacher) {
  return (
    teacher.full_name ||
    teacher.name ||
    [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") ||
    teacher.email ||
    `Teacher ${teacher.id.slice(0, 8)}`
  );
}

export default function AssignTeacher() {
  const [schoolId, setSchoolId] = useState("");
  const [adminId, setAdminId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [teacherId, setTeacherId] = useState("");
  const [className, setClassName] = useState("");
  const [subjectName, setSubjectName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please log in again.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, school_id, role, status")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (
        profile.role !== "school_admin" ||
        profile.status !== "active" ||
        !profile.school_id
      ) {
        throw new Error(
          "Only an active school administrator can assign teachers."
        );
      }

      setSchoolId(profile.school_id);
      setAdminId(user.id);

      const [
        { data: teacherRows, error: teacherError },
        { data: studentRows, error: studentError },
        { data: assignmentRows, error: assignmentError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("school_id", profile.school_id)
          .eq("role", "teacher")
          .eq("status", "active"),

        supabase
          .from("students")
          .select("class_name")
          .eq("school_id", profile.school_id),

        supabase
          .from("teacher_class_assignments")
          .select("*")
          .eq("school_id", profile.school_id)
          .order("created_at", { ascending: false }),
      ]);

      if (teacherError) throw teacherError;
      if (studentError) throw studentError;
      if (assignmentError) throw assignmentError;

      const uniqueClasses = [
        ...new Set(
          (studentRows || [])
            .map((student) => student.class_name?.trim())
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b));

      setTeachers(teacherRows || []);
      setClasses(uniqueClasses);
      setAssignments(assignmentRows || []);

      setTeacherId((current) =>
        teacherRows?.some((teacher) => teacher.id === current)
          ? current
          : teacherRows?.[0]?.id || ""
      );

      setClassName((current) =>
        uniqueClasses.includes(current) ? current : uniqueClasses[0] || ""
      );
    } catch (err) {
      setError(err.message || "Could not load teacher assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAssign(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!schoolId || !adminId) {
      setError("Your administrator session is missing. Please refresh.");
      return;
    }

    if (!teacherId || !className || !subjectName.trim()) {
      setError("Select a teacher, choose a class, and enter a subject.");
      return;
    }

    const duplicate = assignments.some(
      (item) =>
        item.teacher_id === teacherId &&
        item.class_name === className &&
        item.subject_name?.trim().toLowerCase() ===
          subjectName.trim().toLowerCase()
    );

    if (duplicate) {
      setError("This teacher already has this class and subject assigned.");
      return;
    }

    setSaving(true);

    try {
      const { error: insertError } = await supabase
        .from("teacher_class_assignments")
        .insert({
          school_id: schoolId,
          teacher_id: teacherId,
          class_name: className,
          subject_name: subjectName.trim(),
          assigned_by: adminId,
        });

      if (insertError) throw insertError;

      setMessage("Teacher assigned successfully.");
      setSubjectName("");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not assign this teacher.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(assignmentId) {
    const confirmed = window.confirm(
      "Remove this teacher's class and subject assignment?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(assignmentId);

    try {
      const { error: deleteError } = await supabase
        .from("teacher_class_assignments")
        .delete()
        .eq("id", assignmentId)
        .eq("school_id", schoolId);

      if (deleteError) throw deleteError;

      setMessage("Assignment removed.");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not remove the assignment.");
    } finally {
      setDeletingId("");
    }
  }

  const selectedTeacher = teachers.find(
    (teacher) => teacher.id === teacherId
  );

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
        <RefreshCw className="animate-spin" size={20} />
        Loading teacher assignments...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            School Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Assign Classes & Subjects
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Assign teachers to the classes and subjects they teach.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <UserRound className="mb-3 text-blue-600" size={23} />
          <p className="text-sm text-slate-500">Active Teachers</p>
          <p className="mt-1 text-2xl font-bold">{teachers.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <GraduationCap className="mb-3 text-blue-600" size={23} />
          <p className="text-sm text-slate-500">Available Classes</p>
          <p className="mt-1 text-2xl font-bold">{classes.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <ClipboardList className="mb-3 text-blue-600" size={23} />
          <p className="text-sm text-slate-500">Total Assignments</p>
          <p className="mt-1 text-2xl font-bold">{assignments.length}</p>
        </div>
      </div>

      <form
        onSubmit={handleAssign}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            New Assignment
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a teacher, class, and subject.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Teacher
            </span>
            <select
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              required
              disabled={!teachers.length}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {getTeacherName(teacher)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Class
            </span>
            <select
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              required
              disabled={!classes.length}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {!classes.length && (
              <span className="mt-1 block text-xs text-amber-600">
                Add students with class names before assigning teachers.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Subject
            </span>
            <input
              type="text"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="e.g. Mathematics"
              required
              maxLength={100}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {selectedTeacher && className && (
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            <span className="font-semibold">Assignment preview:</span>{" "}
            {getTeacherName(selectedTeacher)} will teach{" "}
            {subjectName.trim() || "the selected subject"} to {className}.
          </div>
        )}

        <button
          type="submit"
          disabled={
            saving ||
            !teachers.length ||
            !classes.length ||
            !teacherId ||
            !className ||
            !subjectName.trim()
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Plus size={18} />
          {saving ? "Saving assignment..." : "Assign Teacher"}
        </button>

        {!teachers.length && (
          <p className="text-sm text-amber-700">
            No active teachers were found for this school. Create or activate
            a teacher account first.
          </p>
        )}
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            Current Assignments
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Teachers, classes, and their assigned subjects.
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="mx-auto mb-3 text-slate-400" size={34} />
            <p className="font-semibold text-slate-700">
              No assignments yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Use the form above to assign your first teacher.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">Teacher</th>
                  <th className="px-5 py-4 font-semibold">Class</th>
                  <th className="px-5 py-4 font-semibold">Subject</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {assignments.map((assignment) => {
                  const teacher = teachers.find(
                    (item) => item.id === assignment.teacher_id
                  );

                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {teacher
                          ? getTeacherName(teacher)
                          : `Teacher ${assignment.teacher_id.slice(0, 8)}`}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
                          {assignment.class_name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {assignment.subject_name}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(assignment.id)}
                          disabled={deletingId === assignment.id}
                          title="Remove assignment"
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          {deletingId === assignment.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
