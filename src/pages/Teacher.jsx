
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  GraduationCap,
  RefreshCw,
  X,
  UserPlus,
  LoaderCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { supabase } from "../lib/superbase";
import { useAuth } from "../context/AuthContext";

function Teachers() {
  const { profile } = useAuth();

  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  async function loadTeachers() {
    if (!profile?.school_id) {
      setTeachers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("id, full_name, role, status, school_id")
        .eq("school_id", profile.school_id)
        .eq("role", "teacher")
        .order("full_name", { ascending: true });

      if (fetchError) throw fetchError;

      setTeachers(data || []);
    } catch (err) {
      console.error("Error loading teachers:", err);
      setError("Unable to load teachers. " + err.message);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, [profile?.school_id]);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openForm() {
    setError("");
    setSuccess("");
    setShowPassword(false);
    setForm({
      full_name: "",
      email: "",
      password: "",
    });
    setShowForm(true);
  }

  function closeForm() {
    if (creating) return;

    setShowForm(false);
    setError("");
  }

  async function handleCreateTeacher(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!profile?.school_id) {
      setError("Your school profile was not found. Please log in again.");
      return;
    }

    if (fullName.length < 2) {
      setError("Enter the teacher's full name.");
      return;
    }

    if (!email) {
      setError("Enter the teacher's email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setCreating(true);

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke("create-teacher-account", {
          body: {
            full_name: fullName,
            email,
            password,
          },
        });

      if (functionError) {
        let message = functionError.message;

        if (functionError.context) {
          try {
            const response = await functionError.context.json();
            if (response?.error) message = response.error;
          } catch {
            // Keep the original function error.
          }
        }

        throw new Error(message || "Could not create teacher account.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSuccess(
        `Teacher account created successfully for ${fullName}. The teacher can sign in using the email and password you provided.`
      );

      setForm({
        full_name: "",
        email: "",
        password: "",
      });

      setShowForm(false);
      setShowPassword(false);

      await loadTeachers();
    } catch (err) {
      console.error("Create teacher error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const filteredTeachers = teachers.filter((teacher) =>
    (teacher.full_name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teacher profiles and teaching assignments."
        action={
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Add teacher
          </button>
        }
      />

      {success && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <p>{success}</p>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && !showForm && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error message"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total teachers</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {teachers.length}
            </p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teachers..."
              aria-label="Search teachers"
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={loadTeachers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Teacher</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Assigned classes</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                    Loading teachers...
                  </td>
                </tr>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800">
                        {teacher.full_name || "Unnamed teacher"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Teacher account
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      Not assigned
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      Not assigned
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          teacher.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {teacher.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <GraduationCap
                      size={32}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="font-semibold text-gray-700">
                      {search ? "No matching teachers" : "No teachers yet"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {search
                        ? "Try a different search term."
                        : "Click Add teacher to create your first teacher account."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-teacher-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2
                  id="add-teacher-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Add a teacher
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create a login account for your school's teacher.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={creating}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-5 p-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="teacher-full-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full name
                </label>
                <input
                  id="teacher-full-name"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Esther Williams"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="teacher-email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  id="teacher-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="teacher@example.com"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="teacher-password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Create password
                </label>

                <div className="relative">
                  <input
                    id="teacher-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleInputChange}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Use a strong password and share it privately with the teacher.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={creating}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create teacher
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;
