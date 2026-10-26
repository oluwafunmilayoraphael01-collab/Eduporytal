import { NavLink, Link } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  School,
  Users,
  UserRound,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  Clock3,
  Wallet,
  Megaphone,
  ArrowLeft,
  X,
} from "lucide-react";

const adminLinks = [
  { label: "Dashboard", to: "/school-admin", icon: LayoutDashboard },
  { label: "Students", to: "/school-admin/students", icon: Users },
  { label: "Teachers", to: "/school-admin/teachers", icon: UserRound },
  { label: "Classes", to: "/school-admin/classes", icon: BookOpen },
  { label: "Results", to: "/school-admin/results", icon: ClipboardCheck },
  { label: "Attendance", to: "/school-admin/attendance", icon: CalendarDays },
  { label: "Timetable", to: "/school-admin/timetable", icon: Clock3 },
  { label: "School fees", to: "/school-admin/fees", icon: Wallet },
  {
    label: "Announcements",
    to: "/school-admin/announcements",
    icon: Megaphone,
  },
];

const superAdminLinks = [
  { label: "Dashboard", to: "/super-admin", icon: LayoutDashboard },
  { label: "Schools", to: "/super-admin/schools", icon: School },
];

function Sidebar({ type = "school", open = false, onClose }) {
  const isSuperAdmin = type === "super";
  const links = isSuperAdmin ? superAdminLinks : adminLinks;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[73px] items-center justify-between border-b border-gray-100 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="rounded-lg bg-blue-600 p-2 text-white">
              <GraduationCap size={23} />
            </span>
            <span className="text-xl font-extrabold text-gray-900">
              Edu<span className="text-blue-600">Portal</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-gray-100 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Workspace
          </p>
          <p className="mt-2 font-semibold text-gray-800">
            {isSuperAdmin ? "Platform Management" : "Greenfield Academy"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isSuperAdmin ? "Super administrator" : "School administrator"}
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              end={to === "/school-admin" || to === "/super-admin"}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Back to website
          </Link>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;