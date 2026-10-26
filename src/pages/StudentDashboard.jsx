
import { useEffect, useState } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  UserRound,
  BookOpen,
  ClipboardCheck,
  FileText,
  LogOut,
  LoaderCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/superbase";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      setLoading(true);
      setError("");

      try {
        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!userData?.user) {
          navigate("/student-login", { replace: true });
          return;
        }

        const { data, error: studentError } = await supabase
          .from("students")
          .select(
            "id, school_id, auth_user_id, first_name, middle_name, last_name, admission_number, class_name, gender, status"
          )
          .eq("auth_user_id", userData.user.id)
          .maybeSingle();

        if (studentError) throw studentError;

        if (!data) {
          throw new Error(
            "Your student record could not be found. Please contact your school administrator."
          );
        }

        if (active) {
          setStudent(data);
        }
      } catch (err) {
        console.error("Unable to load student dashboard:", err);

        if (active) {
          setError(
            err.message || "Unable to load your student information."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStudent();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      const { error: logoutError } =
        await supabase.auth.signOut();

      if (logoutError) throw logoutError;

      navigate("/student-login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Unable to log out. Please try again.");
      setLoggingOut(false);
    }
  }

  const studentName = student
    ? [
        student.first_name,
        student.middle_name,
        student.last_name,
      ]
        .filter(Boolean)
        .join(" ") || "Student"
    : "Student";

  const admissionNumber =
    student?.admission_number || "Not available";

  const studentClass =
    student?.class_name || "Not assigned";

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-600">
        <LoaderCircle
          size={36}
          className="animate-spin text-blue-600"
        />
        <p className="mt-4 font-medium">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/student" className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <GraduationCap size={26} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold">
                Edu<span className="text-blue-600">Portal</span>
              </h1>
              <p className="text-xs text-slate-500">
                Student Portal
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {loggingOut ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <LogOut size={17} />
            )}

            <span>
              {loggingOut ? "Logging out..." : "Log out"}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            STUDENT DASHBOARD
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Welcome, {studentName}!
          </h2>

          <p className="mt-2 text-slate-500">
            View your student information and access your school
            resources.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />
            <p>{error}</p>
          </div>
        )}

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
              <UserRound size={24} />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Student name
            </p>
            <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
              {studentName}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-xl bg-purple-50 p-3 text-purple-600">
              <GraduationCap size={24} />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Admission number
            </p>
            <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
              {admissionNumber}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <BookOpen size={24} />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Class
            </p>
            <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
              {studentClass}
            </h3>
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-xl font-bold text-slate-900">
            Your school resources
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Access your attendance, examination results, and
            academic information.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Attendance */}
            <Link
              to="/student/attendance"
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <ClipboardCheck size={23} />
              </div>

              <h4 className="mt-4 font-bold text-slate-900">
                Attendance
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                View your attendance percentage, absences, and
                daily records.
              </p>

              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                View attendance
                <ArrowRight
                  size={14}
                  className="transition group-hover:translate-x-1"
                />
              </span>
            </Link>

            {/* Results */}
            <Link
              to="/student/results"
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <div className="inline-flex rounded-xl bg-amber-50 p-3 text-amber-600">
                <FileText size={23} />
              </div>

              <h4 className="mt-4 font-bold text-slate-900">
                Results &amp; Reports
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Access examination results, subject scores, and
                grades.
              </p>

              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                View results
                <ArrowRight
                  size={14}
                  className="transition group-hover:translate-x-1"
                />
              </span>
            </Link>

            {/* Academic information */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <LayoutDashboard size={23} />
              </div>

              <h4 className="mt-4 font-bold text-slate-900">
                Academic Information
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                View your academic information and school updates.
              </p>

              <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                Coming soon
              </span>
            </article>
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} EduPortal. All rights reserved.
      </footer>
    </div>
  );
}
