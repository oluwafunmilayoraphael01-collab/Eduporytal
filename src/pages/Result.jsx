
import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  RefreshCw,
  Search,
  Plus,
  Save,
  Send,
  Edit,
  AlertCircle,
  CheckCircle2,
  UserRound,
  GraduationCap,
} from "lucide-react";

import { supabase } from "../lib/superbase";
import { useAuth } from "../context/AuthContext";

const TERMS = ["First Term", "Second Term", "Third Term"];

const CONTROL_STYLE =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function getGrade(total) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

function getRemark(total) {
  if (total >= 70) return "Excellent";
  if (total >= 60) return "Very Good";
  if (total >= 50) return "Good";
  if (total >= 45) return "Fair";
  if (total >= 40) return "Pass";
  return "Needs Improvement";
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {children}
    </label>
  );
}

function ScoreBox({ label, value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className={`rounded-xl p-4 ${colors[color] || colors.blue}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function Results() {
  const { profile } = useAuth();

  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);

  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("First Term");
  const [ca, setCa] = useState("");
  const [exam, setExam] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [editingResultId, setEditingResultId] = useState(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const total = Number(ca || 0) + Number(exam || 0);
  const grade = getGrade(total);

  const selectedStudent = students.find(
    (student) => student.id === studentId
  );

  const filteredStudents = students.filter((student) => {
    const fullName = [
      student.first_name,
      student.middle_name,
      student.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const search = studentSearch.toLowerCase();

    return (
      fullName.includes(search) ||
      (student.admission_number || "").toLowerCase().includes(search) ||
      (student.class_name || "").toLowerCase().includes(search)
    );
  });

  const loadStudents = useCallback(async () => {
    if (!profile?.school_id) {
      setStudents([]);
      setLoadingStudents(false);
      return;
    }

    setLoadingStudents(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("students")
        .select(
          "id, school_id, first_name, middle_name, last_name, admission_number, class_name"
        )
        .eq("school_id", profile.school_id)
        .order("first_name", { ascending: true });

      if (queryError) throw queryError;

      setStudents(data || []);
    } catch (err) {
      console.error("Error loading students:", err);
      setError(`Could not load students: ${err.message}`);
    } finally {
      setLoadingStudents(false);
    }
  }, [profile?.school_id]);

  const loadHistory = useCallback(async () => {
    if (!profile?.school_id || !studentId) {
      setHistory([]);
      return;
    }

    setLoadingHistory(true);

    try {
      const { data, error: queryError } = await supabase
        .from("student_results")
        .select(
          "id, subject_name, academic_session, term, ca_score, exam_score, total_score, grade, remarks, is_published, created_at"
        )
        .eq("school_id", profile.school_id)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setHistory(data || []);
    } catch (err) {
      console.error("Error loading result history:", err);
      setError(`Could not load result history: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  }, [profile?.school_id, studentId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function resetForm() {
    setSubject("");
    setSession("");
    setTerm("First Term");
    setCa("");
    setExam("");
    setRemarks("");
    setIsPublished(false);
    setEditingResultId(null);
    setError("");
    setNotice("");
  }

  async function handleSaveResult(shouldPublish = false) {
    setError("");
    setNotice("");

    if (!profile?.school_id) {
      setError("Your account is not linked to a school.");
      return;
    }

    if (!studentId || !subject.trim() || !session.trim()) {
      setError(
        "Please select a student and enter the subject and academic session."
      );
      return;
    }

    if (
      ca === "" ||
      exam === "" ||
      !Number.isFinite(Number(ca)) ||
      !Number.isFinite(Number(exam))
    ) {
      setError("Please enter valid CA and examination scores.");
      return;
    }

    const caScore = Number(ca);
    const examScore = Number(exam);

    if (caScore < 0 || caScore > 40) {
      setError("CA score must be between 0 and 40.");
      return;
    }

    if (examScore < 0 || examScore > 60) {
      setError("Examination score must be between 0 and 60.");
      return;
    }

    // Do not include total_score or grade.
    // Supabase generates these columns automatically.
    const payload = {
      school_id: profile.school_id,
      student_id: studentId,
      subject_name: subject.trim(),
      academic_session: session.trim(),
      term,
      ca_score: caScore,
      exam_score: examScore,
      remarks: remarks.trim() || getRemark(caScore + examScore),
      is_published: shouldPublish,
    };

    setSaving(true);

    try {
      let query;

      if (editingResultId) {
        query = supabase
          .from("student_results")
          .update(payload)
          .eq("id", editingResultId)
          .eq("school_id", profile.school_id)
          .select("id")
          .maybeSingle();
      } else {
        query = supabase
          .from("student_results")
          .insert(payload)
          .select("id")
          .single();
      }

      const { data, error: saveError } = await query;

      if (saveError) throw saveError;

      if (!data) {
        throw new Error(
          "No result was returned. Check your Supabase permissions and row-level security policies."
        );
      }

      setNotice(
        shouldPublish
          ? "Result published successfully."
          : "Result saved as a draft successfully."
      );

      setEditingResultId(null);
      setSubject("");
      setSession("");
      setTerm("First Term");
      setCa("");
      setExam("");
      setRemarks("");
      setIsPublished(false);

      await loadHistory();
    } catch (err) {
      console.error("Error saving result:", err);
      setError(`Could not save result: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function editResult(result) {
    setEditingResultId(result.id);
    setStudentId(studentId);
    setSubject(result.subject_name || "");
    setSession(result.academic_session || "");
    setTerm(result.term || "First Term");
    setCa(String(result.ca_score ?? ""));
    setExam(String(result.exam_score ?? ""));
    setRemarks(result.remarks || "");
    setIsPublished(Boolean(result.is_published));
    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white">
            <GraduationCap size={25} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">EduPortal</h1>
            <p className="text-sm text-gray-500">Teacher Results</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Student Results
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter, review, and publish student assessment results.
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            New Result
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <p>{error}</p>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <p>{notice}</p>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <ClipboardCheck size={21} />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  {editingResultId ? "Edit Result" : "Enter Result"}
                </h3>
                <p className="text-sm text-gray-500">
                  CA: 40 marks · Examination: 60 marks
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <Field label="Search student">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Name, admission number or class"
                    className={`${CONTROL_STYLE} pl-9`}
                  />
                </div>
              </Field>

              <Field label="Select student">
                <select
                  value={studentId}
                  onChange={(event) => {
                    setStudentId(event.target.value);
                    setEditingResultId(null);
                    setHistory([]);
                  }}
                  className={CONTROL_STYLE}
                  disabled={loadingStudents}
                >
                  <option value="">
                    {loadingStudents
                      ? "Loading students..."
                      : "Choose a student"}
                  </option>

                  {filteredStudents.map((student) => {
                    const fullName = [
                      student.first_name,
                      student.middle_name,
                      student.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <option key={student.id} value={student.id}>
                        {fullName}
                        {student.admission_number
                          ? ` (${student.admission_number})`
                          : ""}
                        {student.class_name
                          ? ` — ${student.class_name}`
                          : ""}
                      </option>
                    );
                  })}
                </select>
              </Field>

              {selectedStudent && (
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                    <UserRound size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {[
                        selectedStudent.first_name,
                        selectedStudent.middle_name,
                        selectedStudent.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedStudent.class_name || "Class not specified"}
                      {selectedStudent.admission_number
                        ? ` · ${selectedStudent.admission_number}`
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              <Field label="Subject name">
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. Mathematics"
                  className={CONTROL_STYLE}
                />
              </Field>

              <Field label="Academic session">
                <input
                  value={session}
                  onChange={(event) => setSession(event.target.value)}
                  placeholder="e.g. 2026/2027"
                  className={CONTROL_STYLE}
                />
              </Field>

              <Field label="Term">
                <select
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  className={CONTROL_STYLE}
                >
                  {TERMS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Continuous Assessment (CA) / 40">
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="1"
                    value={ca}
                    onChange={(event) => setCa(event.target.value)}
                    placeholder="0–40"
                    className={CONTROL_STYLE}
                  />
                </Field>

                <Field label="Examination / 60">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    value={exam}
                    onChange={(event) => setExam(event.target.value)}
                    placeholder="0–60"
                    className={CONTROL_STYLE}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <ScoreBox label="Total / 100" value={total} color="blue" />
                <ScoreBox label="Grade" value={grade} color="purple" />
                <ScoreBox
                  label="Remark"
                  value={getRemark(total)}
                  color="green"
                />
              </div>

              <Field label="Remarks (optional)">
                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Enter teacher's remarks"
                  rows={3}
                  className={CONTROL_STYLE}
                />
              </Field>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveResult(false)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Draft"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveResult(true)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={17} />
                  {saving ? "Saving..." : "Publish Result"}
                </button>
              </div>

              {editingResultId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel editing
                </button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                  <FileText size={21} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">Result History</h3>
                  <p className="text-sm text-gray-500">
                    Saved results for the selected student
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadHistory}
                disabled={!studentId || loadingHistory}
                title="Refresh history"
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loadingHistory ? "animate-spin" : ""}
                />
              </button>
            </div>

            {!studentId ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center">
                <BookOpen
                  size={30}
                  className="mx-auto mb-3 text-gray-400"
                />
                <p className="font-medium text-gray-700">
                  No student selected
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Select a student to view their result history.
                </p>
              </div>
            ) : loadingHistory ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Loading result history...
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center">
                <FileText
                  size={30}
                  className="mx-auto mb-3 text-gray-400"
                />
                <p className="font-medium text-gray-700">
                  No results found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Results saved for this student will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((result) => (
                  <article
                    key={result.id}
                    className="rounded-xl border border-gray-200 p-4 transition hover:border-blue-200"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {result.subject_name}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          {result.academic_session} · {result.term}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          CA: {result.ca_score}/40 · Exam:{" "}
                          {result.exam_score}/60
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            result.is_published
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {result.is_published ? "Published" : "Draft"}
                        </span>

                        <button
                          type="button"
                          onClick={() => editResult(result)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={15} />
                          Edit
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                      <div>
                        <span className="text-xs text-gray-500">
                          Total score
                        </span>
                        <p className="font-bold text-gray-900">
                          {result.total_score}/100
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-500">Grade</span>
                        <p className="text-lg font-bold text-blue-700">
                          {result.grade}
                        </p>
                      </div>
                    </div>

                    {result.remarks && (
                      <p className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Remark:</span>{" "}
                        {result.remarks}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-400">
                      Saved {formatDate(result.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
