
import { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  FileText,
  Users,
  Search,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/superbase";

function TeacherDashboard() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  async function loadStudents() {
    if (!profile?.school_id) {
      setStudents([]);
      setError("Your teacher profile has no school assigned.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("students")
        .select(
          "id, first_name, last_name, middle_name, admission_number, class_name, gender, status"
        )
        .eq("school_id", profile.school_id)
        .order("class_name")
        .order("last_name");

      if (fetchError) throw fetchError;

      setStudents(data || []);
    } catch (err) {
      console.error("Error loading students:", err);
      setError(err.message || "Could not load students.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      const result = await logout();

      if (result?.error) {
        throw result.error;
      }

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      setError(err.message || "Unable to sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, [profile?.school_id]);

  const classes = useMemo(() => {
    const grouped = {};

    students.forEach((student) => {
      const className = student.class_name || "Unassigned Class";

      if (!grouped[className]) {
        grouped[className] = [];
      }

      grouped[className].push(student);
    });

    return Object.entries(grouped).map(([name, classStudents]) => ({
      name,
      students: classStudents,
    }));
  }, [students]);

  const filteredClasses = classes.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedClassData = classes.find(
    (item) => item.name === selectedClass
  );

  const filteredStudents = (selectedClassData?.students || []).filter(
    (student) => {
      const fullName = [
        student.first_name,
        student.middle_name,
        student.last_name,
        student.admission_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fullName.includes(search.toLowerCase());
    }
  );

  const activeStudents = students.filter(
    (student) => student.status?.toLowerCase() === "active"
  ).length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-5 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3 text-white">
              <GraduationCap size={26} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                EduPortal
              </h1>
              <p className="text-sm text-gray-500">
                Teacher Dashboard
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
          >
            <LogOut size={18} />
            <span>
              {loggingOut ? "Signing out..." : "Sign Out"}
            </span>
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Welcome, {profile?.full_name || "Teacher"}!
        </h2>

        <p className="mt-2 text-gray-600">
          Manage your classes, attendance, and student results.
        </p>

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<BookOpen size={25} />}
            title="Total Classes"
            value={loading ? "..." : classes.length}
          />

          <StatCard
            icon={<Users size={25} />}
            title="Total Students"
            value={loading ? "..." : students.length}
          />

          <StatCard
            icon={<GraduationCap size={25} />}
            title="Active Students"
            value={loading ? "..." : activeStudents}
          />
        </div>

        {/* My Classes */}
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedClass || "My Classes"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {selectedClass
                  ? "Students registered in this class."
                  : "Select a class to view its students."}
              </p>
            </div>

            <div className="flex gap-2">
              {selectedClass && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClass("");
                    setSearch("");
                  }}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={loadStudents}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          <div className="relative mt-5">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                selectedClass
                  ? "Search students..."
                  : "Search classes..."
              }
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Notice</p>
              <p className="mt-1 break-words">{error}</p>

              {!loggingOut && (
                <button
                  type="button"
                  onClick={loadStudents}
                  className="mt-3 font-semibold underline"
                >
                  Retry loading students
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="py-14 text-center text-gray-500">
              Loading classes and students...
            </div>
          ) : error && students.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No student data is available.
            </div>
          ) : selectedClass ? (
            filteredStudents.length === 0 ? (
              <div className="py-14 text-center text-gray-500">
                No students match your search.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Admission Number</th>
                      <th className="px-4 py-3">Gender</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 font-medium text-gray-900">
                          {[
                            student.first_name,
                            student.middle_name,
                            student.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </td>

                        <td className="px-4 py-4 text-gray-600">
                          {student.admission_number || "—"}
                        </td>

                        <td className="px-4 py-4 capitalize text-gray-600">
                          {student.gender || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-700">
                            {student.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : classes.length === 0 ? (
            <div className="py-14 text-center">
              <BookOpen
                size={40}
                className="mx-auto text-gray-300"
              />
              <h4 className="mt-4 font-semibold text-gray-800">
                No classes found
              </h4>
              <p className="mt-2 text-sm text-gray-500">
                Register students with a class in your school to see classes here.
              </p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No classes match your search.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredClasses.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => {
                    setSelectedClass(item.name);
                    setSearch("");
                  }}
                  className="group rounded-xl border border-gray-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                      <BookOpen size={24} />
                    </div>

                    <ChevronRight
                      size={20}
                      className="text-gray-400 group-hover:text-blue-600"
                    />
                  </div>

                  <h4 className="mt-4 text-lg font-bold text-gray-900">
                    {item.name}
                  </h4>

                  <p className="mt-1 text-sm text-gray-500">
                    {item.students.length}{" "}
                    {item.students.length === 1 ? "student" : "students"}
                  </p>

                  <span className="mt-4 inline-block text-sm font-semibold text-blue-600">
                    View students →
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Teacher Features */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon={<ClipboardCheck size={25} />}
            title="Attendance"
            description="Mark daily attendance, record absences and lateness, and review attendance records."
            onClick={() => navigate("/school/attendance")}
          />

          <FeatureCard
            icon={<FileText size={25} />}
            title="Student Results"
            description="Enter CA scores out of 40 and exam scores out of 60, calculate grades, save results, and publish them."
            onClick={() => navigate("/teacher/results")}
          />
        </div>
      </section>
    </main>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
          {icon}
        </div>

        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
          {icon}
        </div>

        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>

      <p className="mt-3 text-sm leading-6 text-gray-500">
        {description}
      </p>

      <span className="mt-4 inline-block text-sm font-semibold text-blue-600">
        Open feature →
      </span>
    </button>
  );
}

export default TeacherDashboard;
