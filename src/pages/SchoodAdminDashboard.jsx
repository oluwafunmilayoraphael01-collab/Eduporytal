
import { useCallback, useEffect, useState } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  School,
  UserRound,
  UserRoundCog,
  RefreshCw,
  LogOut,
  Menu,
  X,
  CheckCircle,
  Clock,
  Wallet,
  UserPlus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/superbase";
import SchoolFees from "./SchoolFees";
import CreateBursar from "./CreateBursar";

function SchoolDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState("Overview");

  const loadDashboard = useCallback(async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    if (!profile?.school_id) {
      setError("Your account is not assigned to a school.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: dashboardError } = await supabase.rpc(
        "get_school_dashboard_stats"
      );

      if (dashboardError) throw dashboardError;

      if (!data || data.length === 0) {
        throw new Error("No active school was found.");
      }

      setSchool(data[0]);
    } catch (err) {
      console.error("School dashboard error:", err);
      setError(err.message || "Unable to load school information.");
    } finally {
      setLoading(false);
    }
  }, [profile?.school_id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const { error: logoutError } = await logout();

      if (logoutError) {
        console.error("Logout failed:", logoutError.message);
        setError(logoutError.message);
        return;
      }

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      setError(err.message || "Unable to sign out.");
    } finally {
      setLoggingOut(false);
    }
  }

  const navigation = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      to: "/school",
    },
    {
      label: "Students",
      icon: Users,
      to: "/school/students",
    },
    {
      label: "Teachers",
      icon: GraduationCap,
      to: "/school/teachers",
    },
    {
      label: "Assign Class / Subject",
      icon: UserRoundCog,
      to: "/school/assign-teacher",
    },
    {
      label: "Fees Paid",
      icon: Wallet,
      to: null,
    },
    {
      label: "Create Bursar Account",
      icon: UserPlus,
      to: null,
    },
  ];

  const stats = [
    {
      label: "Total Students",
      value: school?.student_count ?? 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Teachers",
      value: school?.teacher_count ?? 0,
      icon: GraduationCap,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "School Status",
      value: school?.school_status ?? "Unavailable",
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
        <Link to="/school" className="flex items-center gap-2 font-extrabold">
          <GraduationCap className="text-blue-600" size={28} />
          Edu<span className="text-blue-600">Portal</span>
        </Link>

        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="hidden h-20 items-center gap-2 border-b border-slate-100 px-6 lg:flex">
            <GraduationCap className="text-blue-600" size={32} />
            <span className="text-xl font-extrabold">
              Edu<span className="text-blue-600">Portal</span>
            </span>
          </div>

          <div className="border-b border-slate-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              School Administration
            </p>

            <h2 className="mt-2 break-words font-bold">
              {school?.school_name || "My School"}
            </h2>

            <p className="mt-1 truncate text-sm text-slate-500">
              {profile?.full_name || user?.email || "Administrator"}
            </p>
          </div>

          <nav className="space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.label === "Overview"
                  ? activeSection === "Overview"
                  : activeSection === item.label;

              const linkClass = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`;

              if (
                item.label === "Fees Paid" ||
                item.label === "Create Bursar Account"
              ) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.label);
                      setSidebarOpen(false);
                    }}
                    className={linkClass}
                  >
                    <Icon size={19} />
                    {item.label}
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => {
                    setActiveSection(
                      item.label === "Overview" ? "Overview" : ""
                    );
                    setSidebarOpen(false);
                  }}
                  className={linkClass}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-4 lg:mt-8">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut size={19} />
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </aside>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          />
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-7xl">
            {activeSection === "Fees Paid" ? (
              <SchoolFees />
            ) : activeSection === "Create Bursar Account" ? (
              <CreateBursar />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      School Administration / Overview
                    </p>

                    <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                      School Dashboard
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                      Manage your school's information from one place.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={17}
                      className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {error}
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="ml-3 font-semibold underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
                    <RefreshCw
                      className="mx-auto animate-spin text-blue-600"
                      size={30}
                    />
                    <p className="mt-4 text-sm text-slate-500">
                      Loading your school information...
                    </p>
                  </div>
                ) : (
                  <>
                    <section className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-5">
                        <div>
                          <p className="text-sm text-blue-100">
                            Welcome back,
                          </p>

                          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                            {profile?.full_name || "School Administrator"}
                          </h2>

                          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                            Manage your school's students and teachers, and
                            keep your school records organized.
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4">
                          <School size={42} />
                        </div>
                      </div>
                    </section>

                    <section className="mt-8">
                      <h2 className="text-lg font-bold">School Overview</h2>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {stats.map((stat) => {
                          const Icon = stat.icon;

                          return (
                            <div
                              key={stat.label}
                              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm text-slate-500">
                                    {stat.label}
                                  </p>

                                  <p className="mt-3 break-words text-2xl font-extrabold capitalize">
                                    {stat.value}
                                  </p>
                                </div>

                                <div className={`rounded-xl p-3 ${stat.color}`}>
                                  <Icon size={23} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                          <School size={23} />
                        </div>

                        <div>
                          <h2 className="font-bold">My School</h2>
                          <p className="text-sm text-slate-500">
                            Your registered school information
                          </p>
                        </div>
                      </div>

                      {school && (
                        <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
                          <div>
                            <p className="text-sm text-slate-500">
                              School Name
                            </p>
                            <p className="mt-1 font-semibold">
                              {school.school_name}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">School ID</p>
                            <p className="mt-1 break-all font-mono text-sm">
                              {school.school_id}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">
                              Registration Status
                            </p>
                            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold capitalize text-green-700">
                              <CheckCircle size={15} />
                              {school.school_status}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">
                              Signed-in Account
                            </p>
                            <p className="mt-1 break-all text-sm font-medium">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </section>

                    <section className="mt-8">
                      <h2 className="text-lg font-bold">Quick Actions</h2>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Link
                          to="/school/students"
                          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                              <UserRound size={23} />
                            </div>

                            <div>
                              <h3 className="font-bold">Manage Students</h3>
                              <p className="mt-1 text-sm text-slate-500">
                                View and manage student records
                              </p>
                            </div>
                          </div>
                        </Link>

                        <Link
                          to="/school/teachers"
                          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                              <GraduationCap size={23} />
                            </div>

                            <div>
                              <h3 className="font-bold">Manage Teachers</h3>
                              <p className="mt-1 text-sm text-slate-500">
                                View and manage teacher records
                              </p>
                            </div>
                          </div>
                        </Link>

                        <Link
                          to="/school/assign-teacher"
                          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                              <UserRoundCog size={23} />
                            </div>

                            <div>
                              <h3 className="font-bold">
                                Assign Class / Subject
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Assign classes and subjects to teachers
                              </p>
                            </div>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setActiveSection("Fees Paid")}
                          className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-300 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                              <Wallet size={23} />
                            </div>

                            <div>
                              <h3 className="font-bold">Fees Paid</h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Record student payments and view outstanding
                                fees.
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setActiveSection("Create Bursar Account")
                          }
                          className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-300 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                              <UserPlus size={23} />
                            </div>

                            <div>
                              <h3 className="font-bold">
                                Create Bursar Account
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Create a separate account for your school's
                                bursar.
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </section>

                    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500">
                      <p>© {new Date().getFullYear()} EduPortal</p>
                      <p className="flex items-center gap-2">
                        <Clock size={15} />
                        School Administration Portal
                      </p>
                    </footer>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SchoolDashboard;
