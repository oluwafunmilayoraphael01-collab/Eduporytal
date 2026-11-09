
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  School,
  BookOpen,
  Layers,
} from "lucide-react";
import { supabase } from "../lib/superbase";

function RegisterSchool() {
  const [form, setForm] = useState({
    school_name: "",
    school_type: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!supabase) {
      setMessage("Supabase is not configured. Check your .env file.");
      return;
    }

    if (!form.school_type) {
      setMessage("Please select your school type.");
      return;
    }

    if (form.password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              full_name: form.contact_name.trim(),
            },
          },
        });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error("Account creation failed. Please try again.");
      }

      if (!data.session) {
        setSuccess(true);
        setMessage(
          "Your account has been created. Check your email to confirm your account. Then sign in and submit your school application. Your school is not approved yet."
        );
        return;
      }

      // Submit school application
      const { error: applicationError } = await supabase
        .from("school_applications")
        .insert({
          applicant_user_id: data.user.id,
          school_name: form.school_name.trim(),
          school_type: form.school_type,
          contact_name: form.contact_name.trim(),
          email,
          phone: form.phone.trim(),
          address: form.address.trim(),
          status: "pending",
        });

      if (applicationError) {
        throw new Error(
          `Your account was created, but the application could not be submitted: ${applicationError.message}. Sign in and try submitting the application again.`
        );
      }

      setSuccess(true);
      setMessage(
        "Registration successful! Your account has been created and your school application is awaiting Super Admin approval."
      );

      setForm({
        school_name: "",
        school_type: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage(
        error.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const schoolTypes = [
    {
      value: "primary",
      title: "Primary School",
      description: "Nursery (optional) and Primary 1–6",
      icon: BookOpen,
    },
    {
      value: "secondary",
      title: "Secondary School",
      description: "JSS1–JSS3 and SS1–SS3",
      icon: School,
    },
    {
      value: "both",
      title: "Both",
      description: "Nursery, Primary and Secondary",
      icon: Layers,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-xl font-extrabold text-slate-900"
        >
          <GraduationCap className="text-blue-600" size={30} />
          Edu<span className="text-blue-600">Portal</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Register Your School
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create your administrator account and submit your school
            details. Your school must be approved by the Super Admin
            before you can manage it.
          </p>

          {message && (
            <div
              role="status"
              className={`mt-5 flex gap-2 rounded-xl p-4 text-sm ${
                success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {success ? (
                <CheckCircle className="shrink-0" size={20} />
              ) : (
                <AlertCircle className="shrink-0" size={20} />
              )}
              <p>{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* School Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                School Name
              </label>

              <input
                name="school_name"
                value={form.school_name}
                onChange={handleChange}
                required
                placeholder="e.g. Bright Future College"
                className={inputClass}
              />
            </div>

            {/* School Type */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                What type of school are you registering?
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                {schoolTypes.map((type) => {
                  const Icon = type.icon;
                  const selected = form.school_type === type.value;

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          school_type: type.value,
                        }))
                      }
                      aria-pressed={selected}
                      className={`rounded-xl border-2 p-4 text-left transition ${
                        selected
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <Icon
                        size={25}
                        className={
                          selected ? "text-blue-600" : "text-slate-500"
                        }
                      />

                      <p className="mt-3 text-sm font-bold text-slate-900">
                        {type.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {type.description}
                      </p>

                      {selected && (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                          <CheckCircle size={14} />
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!form.school_type && (
                <p className="mt-2 text-xs text-slate-500">
                  Select the section or sections your school operates.
                </p>
              )}

              {form.school_type === "primary" && (
                <p className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  Your school will have access to primary classes. You
                  can configure your nursery classes separately.
                </p>
              )}

              {form.school_type === "secondary" && (
                <p className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  Your school will have access to JSS1–JSS3 and SS1–SS3.
                </p>
              )}

              {form.school_type === "both" && (
                <p className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  Your school will have access to nursery, primary and
                  secondary sections. You can configure nursery classes
                  separately.
                </p>
              )}
            </div>

            {/* Administrator */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Administrator's Full Name
              </label>

              <input
                name="contact_name"
                value={form.contact_name}
                onChange={handleChange}
                required
                autoComplete="name"
                placeholder="Enter your full name"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="admin@example.com"
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                autoComplete="tel"
                placeholder="School contact number"
                className={inputClass}
              />
            </div>

            {/* Address */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                School Address
              </label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Full school address"
                className={`${inputClass} resize-y`}
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Create Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} />
              {loading ? "Creating Account..." : "Create Account & Apply"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} EduPortal
        </p>
      </div>
    </div>
  );
}

export default RegisterSchool;
