import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Bell, Menu, Search, UserRound } from "lucide-react";
import Sidebar from "./Sidebar";

function DashboardLayout({ type = "school" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        type={type}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-[73px] items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <Menu size={23} />
            </button>

            <div className="hidden items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-400 sm:flex">
              <Search size={17} />
              <span>Search dashboard...</span>
            </div>

            <span className="text-sm font-semibold text-gray-800 sm:hidden">
              EduPortal
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-xl p-2.5 text-gray-500 hover:bg-gray-100"
            >
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-3 sm:pl-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <UserRound size={21} />
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">
                  {type === "super" ? "Super Admin" : "School Admin"}
                </p>
                <p className="text-xs text-gray-500">
                  {type === "super" ? "Platform owner" : "Administrator"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;