
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
  Palette,
  BookOpen,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/superbase";

import SchoolFees from "./SchoolFees";
import CreateBursar from "./CreateBursar";
import StudentPromotion from "./StudentPromotion";
import ClassConfiguration from "./ClassConfiguration";
import SchoolAppearance from "../components/SchoolAppearance";

function SchoolDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState("Overview");

  // School branding
  const [branding, setBranding] = useState({
    logo_url: "",
    primary_color: "#2563eb",
    secondary_color: "#0f172a",
    accent_color: "#f59e0b",
  });

  // Load dashboard information
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

      const { data: schoolTypeData, error: schoolTypeError } =
        await supabase
          .from("schools")
          .select("school_type")
          .eq("id", profile.school_id)
          .maybeSingle();

      if (schoolTypeError) throw schoolTypeError;

      setSchool({
        ...data[0],
        school_type: schoolTypeData?.school_type || null,
      });
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

  // Load saved school branding
  const loadBranding = useCallback(async () => {
    if (!profile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from("schools")
        .select(
          "logo_url, primary_color, secondary_color, accent_color"
        )
        .eq("id", profile.school_id)
        .single();

      if (error) throw error;

      setBranding({
        logo_url: data.logo_url || "",
        primary_color: data.primary_color || "#2563eb",
        secondary_color: data.secondary_color || "#0f172a",
        accent_color: data.accent_color || "#f59e0b",
      });
    } catch (err) {
      console.error("Branding loading error:", err);
    }
  }, [profile?.school_id]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  // Logout
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

  const schoolType = school?.school_type;

  // Sidebar navigation
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
    ...(schoolType === "primary" || schoolType === "both"
      ? [
          {
            label: "Nursery Classes",
            icon: BookOpen,
            to: null,
          },
        ]
      : []),
    {
      label: "Student Promotion",
      icon: RefreshCw,
      to: null,
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
    {
      label: "School Appearance",
      icon: Palette,
      to: null,
    },
  ];

  // Dashboard statistics
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

  const schoolName = school?.school_name || "My School";
  const logo = branding.logo_url;

  // Academic sections based on registered school type
  const schoolSections = [
    ...(schoolType === "primary" || schoolType === "both"
      ? [
          {
            name: "Nursery",
            classes: "School-configured classes",
            description:
              "Add and manage your own Nursery classes, such as Playgroup, Nursery 1, Nursery 2 and Nursery 3.",
            icon: School,
          },
          {
            name: "Primary",
            classes: "Primary 1 – Primary 6",
            description:
              "Manage primary school students, teachers and academic records.",
            icon: GraduationCap,
          },
        ]
      : []),

    ...(schoolType === "secondary" || schoolType === "both"
      ? [
          {
            name: "Secondary",
            classes: "JSS1 – JSS3 and SS1 – SS3",
            description:
              "Manage junior and senior secondary students and academic records.",
            icon: GraduationCap,
          },
        ]
      : []),
  ];

  const formattedSchoolType =
    schoolType === "both"
      ? "Primary & Secondary"
      : schoolType === "primary"
        ? "Primary School"
        : schoolType === "secondary"
          ? "Secondary School"
          : "Not configured";

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800"
      style={{
        "--school-primary": branding.primary_color,
        "--school-secondary": branding.secondary_color,
        "--school-accent": branding.accent_color,
      }}
    >
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
        <Link
          to="/school"
          className="flex items-center gap-2 font-extrabold"
        >
          {logo ? (
            <img
              src={logo}
              alt="School logo"
              className="h-9 w-9 rounded-lg object-contain"
            />
          ) : (
            <GraduationCap
              size={28}
              style={{ color: branding.primary_color }}
            />
          )}

          <span>{schoolName}</span>
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
          {/* Desktop school logo */}
          <div className="hidden h-20 items-center gap-3 border-b border-slate-100 px-6 lg:flex">
            {logo ? (
              <img
                src={logo}
                alt="School logo"
                className="h-10 w-10 rounded-lg object-contain"
              />
            ) : (
              <GraduationCap
                size={32}
                style={{ color: branding.primary_color }}
              />
            )}

            <span className="text-lg font-extrabold">
              {schoolName}
            </span>
          </div>

          {/* Admin information */}
          <div className="border-b border-slate-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              School Administration
            </p>

            <h2 className="mt-2 break-words font-bold">
              {schoolName}
            </h2>

            <p className="mt-1 truncate text-sm text-slate-500">
              {profile?.full_name || user?.email || "Administrator"}
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.label === "Overview"
                  ? activeSection === "Overview"
                  : activeSection === item.label;

              const linkClass = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                isActive
                  ? "text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`;

              const activeStyle = isActive
                ? { backgroundColor: branding.primary_color }
                : undefined;

              if (item.to === null) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.label);
                      setSidebarOpen(false);
                    }}
                    className={linkClass}
                    style={activeStyle}
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
                  style={activeStyle}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
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

            {/* Nursery Class Configuration */}
            {activeSection === "Nursery Classes" ? (
              <ClassConfiguration />
            ) : activeSection === "School Appearance" ? (
              <SchoolAppearance
                school={school}
                onBrandingSaved={(updatedBranding) => {
                  setBranding((current) => ({
                    ...current,
                    ...updatedBranding,
                  }));
                }}
              />
            ) : activeSection === "Fees Paid" ? (
              <SchoolFees />
            ) : activeSection === "Create Bursar Account" ? (
              <CreateBursar />
            ) : activeSection === "Student Promotion" ? (
              <StudentPromotion />
            ) : (
              <>
                {/* Dashboard Header */}
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
                    onClick={() => {
                      loadDashboard();
                      loadBranding();
                    }}
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

                {/* Error */}
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
                    {/* Welcome Banner */}
                    <section
                      className="mt-8 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
                      style={{
                        background: `linear-gradient(110deg, ${branding.primary_color}, ${branding.secondary_color})`,
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-5">
                        <div>
                          <p className="text-sm text-white/80">
                            Welcome back,
                          </p>

                          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                            {profile?.full_name || "School Administrator"}
                          </h2>

                          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
                            Manage your school's students and teachers, and
                            keep your school records organized.
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4">
                          {logo ? (
                            <img
                              src={logo}
                              alt="School logo"
                              className="h-12 w-12 object-contain"
                            />
                          ) : (
                            <School size={42} />
                          )}
                        </div>
                      </div>
                    </section>

                    {/* School Overview */}
                    <section className="mt-8">
                      <h2 className="text-lg font-bold">
                        School Overview
                      </h2>

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

                    {/* My School */}
                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-xl p-3 text-white"
                          style={{
                            backgroundColor: branding.primary_color,
                          }}
                        >
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
                            <p className="text-sm text-slate-500">
                              School ID
                            </p>
                            <p className="mt-1 break-all font-mono text-sm">
                              {school.school_id}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">
                              School Type
                            </p>
                            <p className="mt-1 font-semibold">
                              {formattedSchoolType}
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

                    {/* Academic Sections */}
                    <section className="mt-8">
                      <div>
                        <h2 className="text-lg font-bold">
                          Academic Sections
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Sections available for your registered school type.
                        </p>
                      </div>

                      {!schoolType ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                          Your school type has not been configured.
                          Please contact the platform administrator.
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {schoolSections.map((section) => {
                            const Icon = section.icon;

                            return (
                              <div
                                key={section.name}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                              >
                                <div
                                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                                  style={{
                                    backgroundColor: `${branding.primary_color}15`,
                                    color: branding.primary_color,
                                  }}
                                >
                                  <Icon size={25} />
                                </div>

                                <h3 className="mt-4 text-lg font-bold">
                                  {section.name}
                                </h3>

                                <p
                                  className="mt-1 text-sm font-semibold"
                                  style={{
                                    color: branding.primary_color,
                                  }}
                                >
                                  {section.classes}
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  {section.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {/* Quick Actions */}
                    <section className="mt-8">
                      <h2 className="text-lg font-bold">
                        Quick Actions
                      </h2>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Link
                          to="/school/students"
                          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-xl p-3"
                              style={{
                                backgroundColor: `${branding.primary_color}15`,
                                color: branding.primary_color,
                              }}
                            >
                              <UserRound size={23} />
                            </div>

                            <div>
                              <h3 className="font-bold">
                                Manage Students
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                View and manage student records
                              </p>
                            </div>
                          </div>
                        </Link>

                        <Link
                          to="/school/teachers"
                          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-xl p-3"
                              style={{
                                backgroundColor: `${branding.secondary_color}15`,
                                color: branding.secondary_color,
                              }}
                            >
                              <GraduationCap size={23} />
                            </div>

                            <div>
                              <h3 className="font-bold">
                                Manage Teachers
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                View and manage teacher records
                              </p>
                            </div>
                          </div>
                        </Link>

                        <Link
                          to="/school/assign-teacher"
                          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-xl p-3"
                              style={{
                                backgroundColor: `${branding.primary_color}15`,
                                color: branding.primary_color,
                              }}
                            >
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
                          onClick={() =>
                            setActiveSection("Student Promotion")
                          }
                          className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-xl p-3"
                              style={{
                                backgroundColor: `${branding.primary_color}15`,
                                color: branding.primary_color,
                              }}
                            >
                              <RefreshCw size={23} />
                            </div>

                            <div>
                              <h3 className="font-bold">
                                Student Promotion
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Review and promote students to a new class.
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveSection("Fees Paid")}
                          className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-xl p-3"
                              style={{
                                backgroundColor: `${branding.accent_color}20`,
                                color: branding.accent_color,
                              }}
                            >
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
                          className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-xl p-3"
                              style={{
                                backgroundColor: `${branding.primary_color}15`,
                                color: branding.primary_color,
                              }}
                            >
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

                        <button
                          type="button"
                          onClick={() =>
                            setActiveSection("School Appearance")
                          }
                          className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-xl p-3"
                              style={{
                                backgroundColor: `${branding.primary_color}15`,
                                color: branding.primary_color,
                              }}
                            >
                              <Palette size={23} />
                            </div>

                            <div>
                              <h3 className="font-bold">
                                School Appearance
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Customize your school's logo and brand colours.
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </section>

                    {/* Footer */}
                    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500">
                      <p>
                        © {new Date().getFullYear()} {schoolName}
                      </p>

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
