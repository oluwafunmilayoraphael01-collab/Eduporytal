
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  School,
  Search,
  RefreshCw,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  Ban,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/superbase";
const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  suspended: "bg-red-50 text-red-700",
  rejected: "bg-slate-100 text-slate-600",
};

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AllSchools() {
  const [schools, setSchools] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSchools = useCallback(async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("schools")
      .select(
        "id, name, email, phone, address, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("Could not load schools:", queryError);
      setError(queryError.message || "Could not load schools.");
    } else {
      setSchools(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const filteredSchools = useMemo(() => {
    const term = search.trim().toLowerCase();

    return schools.filter((school) => {
      const matchesSearch =
        !term ||
        [school.name, school.email, school.phone, school.address]
          .some((value) => (value || "").toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === "all" || school.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [schools, search, statusFilter]);

  async function changeSchoolStatus(school) {
    const nextStatus =
      school.status === "active" ? "suspended" : "active";

    const action = nextStatus === "suspended" ? "suspend" : "reactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${school.name}?`
    );

    if (!confirmed) return;

    setUpdatingId(school.id);
    setError("");
    setNotice("");

    try {
      // This RPC must be created in Supabase SQL Editor.
      const { error: updateError } = await supabase.rpc(
        "set_school_status",
        {
          p_school_id: school.id,
          p_new_status: nextStatus,
        }
      );

      if (updateError) throw updateError;

      setSchools((current) =>
        current.map((item) =>
          item.id === school.id
            ? { ...item, status: nextStatus }
            : item
        )
      );

      setNotice(
        `${school.name} has been ${nextStatus === "active" ? "reactivated" : "suspended"}.`
      );
    } catch (err) {
      console.error("Could not update school status:", err);
      setError(
        err.message ||
          "Could not change this school's status. Check your Supabase function and permissions."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = {
    all: schools.length,
    active: schools.filter((school) => school.status === "active").length,
    pending: schools.filter((school) => school.status === "pending").length,
    suspended: schools.filter((school) => school.status === "suspended").length,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-100">
              PLATFORM MANAGEMENT
            </p>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              All Schools
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
              View registered schools and manage their access to EduPortal.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSchools}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "All Schools", value: counts.all, icon: School },
          { label: "Active", value: counts.active, icon: CheckCircle },
          { label: "Pending", value: counts.pending, icon: Clock },
          { label: "Suspended", value: counts.suspended, icon: Ban },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-extrabold">
                  {loading ? "..." : value}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Icon size={21} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Registered schools</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredSchools.length} school
              {filteredSchools.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
              <Search size={17} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search schools..."
                className="min-w-0 bg-transparent text-sm outline-none sm:w-48"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading schools...
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="p-12 text-center">
            <School size={34} className="mx-auto text-slate-300" />
            <h3 className="mt-4 font-semibold">No schools found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Try another search or status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSchools.map((school) => (
              <article
                key={school.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <School size={23} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-800">
                        {school.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          statusStyles[school.status] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {school.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-4">
                      {school.email && (
                        <span className="flex items-center gap-1.5 break-all">
                          <Mail size={14} />
                          {school.email}
                        </span>
                      )}

                      {school.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={14} />
                          {school.phone}
                        </span>
                      )}

                      {school.address && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          {school.address}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Registered {formatDate(school.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {school.status === "active" ||
                  school.status === "suspended" ? (
                    <button
                      type="button"
                      disabled={updatingId === school.id}
                      onClick={() => changeSchoolStatus(school)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                        school.status === "active"
                          ? "border border-red-200 text-red-600 hover:bg-red-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {updatingId === school.id
                        ? "Updating..."
                        : school.status === "active"
                          ? "Suspend"
                          : "Reactivate"}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      No status action
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AllSchools;
