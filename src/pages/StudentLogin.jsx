
import { useState } from "react";
import {
  GraduationCap,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/superbase";

export default function StudentLogin() {
  const navigate = useNavigate();

  const [admissionNumber, setAdmissionNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.functions.invoke("student-login", {
          body: {
            admission_number: admissionNumber.trim().toUpperCase(),
            password,
          },
        });

      if (loginError) {
        let message = loginError.message;

        try {
          const details = await loginError.context?.json();
          if (details?.error) message = details.error;
        } catch {
          // Use the original error message.
        }

        throw new Error(message);
      }

      if (!data?.access_token || !data?.refresh_token) {
        throw new Error(data?.error || "Login failed. Please try again.");
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) throw sessionError;

      navigate("/student", { replace: true });
    } catch (err) {
      console.error("Student login error:", err);
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to EduPortal
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <GraduationCap size={34} />
          </div>

          <h1 className="mt-6 text-center text-2xl font-extrabold text-slate-900">
            Student Login
          </h1>

          <p className="mt-2 text-center text-sm text-slate-500">
            Sign in using the details provided by your school.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="admissionNumber"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Admission Number
              </label>

              <div className="relative">
                <UserRound
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="admissionNumber"
                  type="text"
                  value={admissionNumber}
                  onChange={(event) =>
                    setAdmissionNumber(event.target.value.toUpperCase())
                  }
                  placeholder="Enter admission number"
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Having trouble signing in? Contact your school administrator.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Powered by <span className="font-bold text-blue-600">EduPortal</span>
        </p>
      </div>
    </main>
  );
}
