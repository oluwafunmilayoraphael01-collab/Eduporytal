
import {
  GraduationCap,
  LayoutDashboard,
  School,
  ClipboardCheck,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  Search,
  Bell,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import AllSchools from "./AllSchool";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SchoolApplications from "./SchoolApplications";
import { supabase } from "../lib/superbase";
function EduportalAdminDashboard() {
  const { profile, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [search, setSearch] = useState("");

  const [schoolCount, setSchoolCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardStats() {
      if (!supabase) {
        setStatsError("Supabase is not configured.");
        setStatsLoading(false);
        return;
      }

      try {
        const [
          { count: schools, error: schoolsError },
          { count: applications, error: applicationsError },
          { count: users, error: usersError },
        ] = await Promise.all([
          supabase
            .from("schools")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("school_applications")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),

          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true }),
        ]);

        if (schoolsError) throw schoolsError;
        if (applicationsError) throw applicationsError;
        if (usersError) throw usersError;

        if (!cancelled) {
          setSchoolCount(schools ?? 0);
          setPendingCount(applications ?? 0);
          setUserCount(users ?? 0);
          setStatsError("");
        }
      } catch (error) {
        console.error("Could not load dashboard statistics:", error);

        if (!cancelled) {
          setStatsError(
            error.message || "Unable to load dashboard statistics."
          );
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }

    loadDashboardStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      title: "Total Schools",
      value: statsLoading ? "..." : String(schoolCount),
      note: "Registered on EduPortal",
      icon: School,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Pending Applications",
      value: statsLoading ? "..." : String(pendingCount),
      note: "Awaiting your review",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Active Subscriptions",
      value: "0",
      note: "Currently subscribed",
      icon: CreditCard,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Total Users",
      value: statsLoading ? "..." : String(userCount),
      note: "Registered EduPortal profiles",
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const navigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "School Applications", icon: ClipboardCheck },
    { label: "All Schools", icon: School },
    { label: "Subscriptions", icon: CreditCard },
    { label: "Platform Settings", icon: Settings },
  ];

  async function handleLogout() {
    const result = await logout();

    if (result?.error) {
      console.error("Logout failed:", result.error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white">
            <GraduationCap size={27} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Edu<span className="text-blue-600">Portal</span>
            </h1>
            <p className="text-xs text-slate-500">
              Platform administration
            </p>
          </div>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setActiveTab(label);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  activeTab === label
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={19} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {(profile?.full_name || "SA").slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {profile?.full_name || "Super Administrator"}
              </p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-bold sm:text-xl">
                {activeTab}
              </h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your EduPortal platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
              <Search size={17} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                className="w-32 bg-transparent text-sm outline-none"
              />
            </div>

            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {activeTab === "Overview" && (
            <>
              <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white sm:p-8">
                <p className="mb-2 text-sm font-medium text-blue-100">
                  EDU PORTAL ADMINISTRATION
                </p>

                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  Manage your school network.
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                  Review school applications, oversee subscriptions, and
                  manage the schools using EduPortal from one central dashboard.
                </p>
              </section>

              {statsError && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  Could not load statistics: {statsError}
                </div>
              )}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(({ title, value, note, icon: Icon, color }) => (
                  <article
                    key={title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {title}
                        </p>
                        <h3 className="mt-3 text-3xl font-extrabold">
                          {value}
                        </h3>
                      </div>

                      <div className={`rounded-xl p-3 ${color}`}>
                        <Icon size={21} />
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-slate-500">{note}</p>
                  </article>
                ))}
              </section>

              <section className="mt-8 grid gap-6 xl:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">School Applications</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Review schools requesting access to EduPortal.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("School Applications")}
                      className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View all <ArrowUpRight size={16} />
                    </button>
                  </div>

                  <div className="mt-8 flex flex-col items-center py-8 text-center">
                    <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
                      <ClipboardCheck size={30} />
                    </div>

                    <h4 className="mt-4 font-semibold">
                      Open School Applications
                    </h4>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      View applications, review school details, and approve
                      or reject requests.
                    </p>

                    <button
                      type="button"
                      onClick={() => setActiveTab("School Applications")}
                      className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      View applications
                    </button>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="font-bold">Platform overview</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Your administration shortcuts.
                  </p>

                  <div className="mt-6 space-y-4">
                    {[
                      {
                        label: "Review applications",
                        detail: "Approve or reject schools",
                        icon: ClipboardCheck,
                        tab: "School Applications",
                      },
                      {
                        label: "Manage schools",
                        detail: "View registered schools",
                        icon: School,
                        tab: "All Schools",
                      },
                      {
                        label: "Subscriptions",
                        detail: "Monitor school plans",
                        icon: TrendingUp,
                        tab: "Subscriptions",
                      },
                    ].map(({ label, detail, icon: Icon, tab }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:border-blue-200 hover:bg-blue-50/50"
                      >
                        <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
                          <Icon size={18} />
                        </span>

                        <span className="flex-1">
                          <span className="block text-sm font-semibold">
                            {label}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {detail}
                          </span>
                        </span>

                        <ArrowUpRight size={16} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </article>
              </section>
            </>
          )}

{activeTab === "School Applications" && <SchoolApplications />}

{activeTab === "All Schools" && <AllSchools />}
          {activeTab !== "Overview" &&
            activeTab !== "School Applications" && 
            activeTab !== "All Schools" && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  {activeTab === "All Schools" && <School size={26} />}
                  {activeTab === "Subscriptions" && <CreditCard size={26} />}
                  {activeTab === "Platform Settings" && <Settings size={26} />}
                </div>

                <h3 className="mt-4 text-xl font-bold">{activeTab}</h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  This section will be connected to real EduPortal platform
                  data in a future step.
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab("Overview")}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Back to overview
                </button>
              </section>
            )}

          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} EduPortal. All rights reserved.
            </p>
            <p>School management, simplified.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default EduportalAdminDashboard;
