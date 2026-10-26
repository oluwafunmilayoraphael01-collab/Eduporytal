
import { useState } from "react";
import { supabase } from "../lib/superbase";
import { UserPlus, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function CreateBursar() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke("create-bursar-account", {
          body: {
            email: form.email.trim().toLowerCase(),
            password: form.password,
          },
        });

      if (functionError) {
        throw new Error(
          functionError.message || "Could not create bursar account."
        );
      }

      if (data?.error || !data?.success) {
        throw new Error(data?.error || "Could not create bursar account.");
      }

      setMessage(
        `Bursar account created successfully for ${data.bursar.email}.`
      );
      setForm({ email: "", password: "" });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <UserPlus size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create Bursar Account
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create login credentials for your school bursar.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {message && (
            <div className="mb-5 flex gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle size={19} className="shrink-0" />
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={19} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="bursar-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Bursar email address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="bursar-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="bursar@school.com"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bursar-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Temporary password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="bursar-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Share the password securely with the bursar. Do not store it in
                the database or display it publicly.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={18} />
              {loading ? "Creating account..." : "Create Bursar Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
