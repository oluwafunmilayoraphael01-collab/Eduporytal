
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/superbase";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await login(email.trim(), password);

      if (result?.error) {
        setError(result.error.message || "Invalid email or password.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Could not verify your account. Please sign in again.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, status, school_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setError("Your EduPortal profile could not be found.");
        return;
      }

      if (profile.status !== "active") {
        setError(
          "Your account is not active. Please contact the administrator."
        );
        return;
      }

      let destination;

switch (profile.role) {
  case "super_admin":
    destination = "/Eduportal-admin";
    break;

  case "school_admin":
    destination = "/school";
    break;

  case "teacher":
    destination = "/teacher";
    break;

  case "parent":
    destination = "/parent";
    break;

  case "student":
    destination = "/student";
    break;

  case "bursar":
    destination = "/bursary";
    break;

  default:
    setError("Your account does not have an assigned role yet.");
    return;
}
      if (
        ["school_admin", "teacher", "parent", "bursar"].includes(
          profile.role
        ) &&
        !profile.school_id
      ) {
        setError("Your account is not linked to a school.");
        return;
      }

      const requestedPath = location.state?.from?.pathname;

      // Only accept a requested path if it matches this user's dashboard.
      navigate(
        requestedPath === destination ? requestedPath : destination,
        { replace: true }
      );
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <Link to="/" className="mb-8 flex items-center gap-3">
          <span className="rounded-xl bg-blue-600 p-3 text-white">
            <GraduationCap size={26} />
          </span>

          <span className="text-2xl font-bold">
            Edu<span className="text-blue-600">Portal</span>
          </span>
        </Link>

        <h1 className="text-3xl font-bold">Welcome back</h1>

        <p className="mt-2 text-gray-500">
          Sign in to your EduPortal account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-medium"
            >
              Email address
            </label>

            <input
              id="login-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@school.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Are you registering a school?{" "}
          <Link
            to="/register-school"
            className="font-semibold text-blue-600 hover:underline"
          >
            Apply here
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-gray-600">
          Are you a bursar?{" "}
          <Link
            to="/bursary-login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Bursary login
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
