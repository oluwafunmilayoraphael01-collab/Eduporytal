
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  LoaderCircle,
  AlertCircle,
  Award,
} from "lucide-react";
import { supabase } from "../lib/superbase";

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      setError("");

      try {
        // Get the currently logged-in student
        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
          throw new Error("Please log in to view your results.");
        }

        // Find the student's school record
        const {
          data: student,
          error: studentError,
        } = await supabase
          .from("students")
          .select("id")
          .eq("auth_user_id", userData.user.id)
          .maybeSingle();

        if (studentError) throw studentError;

        if (!student) {
          throw new Error(
            "Your student record could not be found. Please contact your school administrator."
          );
        }

        // Fetch only this student's published results
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
          .eq("student_id", student.id)
          .eq("is_published", true)
          .order("subject_name", { ascending: true });

        if (resultsError) throw resultsError;

        setResults(resultData || []);
      } catch (err) {
        setError(err.message || "Unable to load results.");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  const totalScore = results.reduce(
    (sum, result) => sum + Number(result.total_score || 0),
    0
  );

  const averageScore =
    results.length > 0
      ? (totalScore / results.length).toFixed(1)
      : "0.0";

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
              View your published scores, grades and remarks.
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <GraduationCap size={30} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-12 text-slate-600 shadow-sm">
            <LoaderCircle className="animate-spin" size={22} />
            Loading your results...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle size={20} />
              Unable to load results
            </div>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <BookOpen
              size={42}
              className="mx-auto mb-4 text-slate-400"
            />
            <h2 className="text-lg font-semibold text-slate-900">
              No published results yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Your results will appear here after your school enters
              and publishes them.
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
                      Subjects with results
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
                      Average score
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {averageScore}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Subject</th>
                      <th className="px-5 py-4 font-semibold">Session</th>
                      <th className="px-5 py-4 font-semibold">Term</th>
                      <th className="px-5 py-4 font-semibold">CA / 40</th>
                      <th className="px-5 py-4 font-semibold">Exam / 60</th>
                      <th className="px-5 py-4 font-semibold">Total</th>
                      <th className="px-5 py-4 font-semibold">Grade</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {result.subject_name}
                          {result.remarks && (
                            <p className="mt-1 max-w-xs whitespace-normal text-xs font-normal text-slate-500">
                              {result.remarks}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {result.academic_session}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {result.term}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
