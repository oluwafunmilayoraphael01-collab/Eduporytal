
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  LoaderCircle,
  AlertCircle,
  Award,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../lib/superbase";

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchResults() {
      setLoading(true);
      setError("");

      try {
        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
          throw new Error("Please log in to view your results.");
        }

        const {
          data: studentData,
          error: studentError,
        } = await supabase
          .from("students")
          .select(
            "id, first_name, middle_name, last_name, admission_number, class_name, status"
          )
          .eq("auth_user_id", userData.user.id)
          .maybeSingle();

        if (studentError) throw studentError;

        if (!studentData) {
          throw new Error(
            "Your student record could not be found. Please contact your school administrator."
          );
        }

        const {
          data: resultData,
          error: resultsError,
        } = await supabase
          .from("student_results")
          .select(`
            id,
            subject_name,
            academic_session,
            term,
            ca_score,
            exam_score,
            total_score,
            grade,
            remarks
          `)
          .eq("student_id", studentData.id)
          .eq("is_published", true)
          .order("academic_session", { ascending: false })
          .order("term", { ascending: true })
          .order("subject_name", { ascending: true });

        if (resultsError) throw resultsError;

        if (active) {
          setStudent(studentData);
          setResults(resultData || []);
        }
      } catch (err) {
        console.error("Unable to load student results:", err);

        if (active) {
          setError(err.message || "Unable to load results.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchResults();

    return () => {
      active = false;
    };
  }, []);

  const studentName = student
    ? [
        student.first_name,
        student.middle_name,
        student.last_name,
      ]
        .filter(Boolean)
        .join(" ")
    : "Student";

  const isGraduated =
    student?.status?.toLowerCase() === "graduated";

  // Group results by academic session and term.
  const groupedResults = results.reduce((groups, result) => {
    const key = `${result.academic_session} - ${result.term}`;

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(result);

    return groups;
  }, {});

  // Calculate average for each session and term.
  function calculateAverage(termResults) {
    if (!termResults.length) return "0.0";

    const total = termResults.reduce(
      (sum, result) =>
        sum + Number(result.total_score || 0),
      0
    );

    return (total / termResults.length).toFixed(1);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-50 text-slate-600">
        <LoaderCircle
          className="animate-spin text-blue-600"
          size={26}
        />
        Loading your results...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/student"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              My Academic Results
            </h1>

            <p className="mt-2 text-slate-600">
              View your published scores, grades and academic records.
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <GraduationCap size={30} />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle size={20} />
              Unable to load results
            </div>

            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        {!error && student && (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Student name
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {studentName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Admission number: {student.admission_number || "N/A"}
                  </p>
                </div>

                <div>
                  {isGraduated ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                      <Award size={17} />
                      Graduated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                      <CheckCircle2 size={17} />
                      {student.class_name || "Active student"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <BookOpen
                  size={42}
                  className="mx-auto mb-4 text-slate-400"
                />

                <h2 className="text-lg font-semibold text-slate-900">
                  No published results yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                  Your results will appear here after your school
                  enters and publishes them.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                        <BookOpen size={22} />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Published subject results
                        </p>

                        <p className="text-2xl font-bold text-slate-900">
                          {results.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                        <Award size={22} />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Academic sessions
                        </p>

                        <p className="text-2xl font-bold text-slate-900">
                          {
                            new Set(
                              results.map(
                                (result) => result.academic_session
                              )
                            ).size
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {Object.entries(groupedResults).map(
                    ([groupName, termResults]) => (
                      <section
                        key={groupName}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h2 className="font-bold text-slate-900">
                              {groupName}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                              {termResults.length} subjects
                            </p>
                          </div>

                          <div className="rounded-xl bg-blue-100 px-4 py-2">
                            <p className="text-xs text-blue-700">
                              Term average
                            </p>

                            <p className="text-xl font-bold text-blue-800">
                              {calculateAverage(termResults)}%
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[750px] text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                              <tr>
                                <th className="px-5 py-4 font-semibold">
                                  Subject
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                  CA / 40
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                  Exam / 60
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                  Total
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                  Grade
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                  Remarks
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                              {termResults.map((result) => (
                                <tr
                                  key={result.id}
                                  className="hover:bg-slate-50"
                                >
                                  <td className="px-5 py-4 font-medium text-slate-900">
                                    {result.subject_name}
                                  </td>

                                  <td className="px-5 py-4 text-slate-600">
                                    {result.ca_score}
                                  </td>

                                  <td className="px-5 py-4 text-slate-600">
                                    {result.exam_score}
                                  </td>

                                  <td className="px-5 py-4 font-semibold text-slate-900">
                                    {result.total_score}/100
                                  </td>

                                  <td className="px-5 py-4">
                                    <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                                      {result.grade}
                                    </span>
                                  </td>

                                  <td className="px-5 py-4 text-slate-600">
                                    {result.remarks || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
