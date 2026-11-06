
import { useCallback, useEffect, useState } from "react";
import {
  School,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import { supabase } from "../lib/superbase";
function SchoolApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("school_applications")
      .select(
        "id, school_name, contact_name, email, phone, address, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setApplications([]);
    } else {
      setApplications(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);
   async function reviewApplication(application, decision) {
    const action = decision === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${application.school_name}?`
    );

    if (!confirmed) return;

    setActionId(application.id);
    setMessage("");
    setError("");

    const functionName =
      decision === "approved"
        ? "approve_school_application"
        : "reject_school_application";

    const { error: actionError } = await supabase.rpc(functionName, {
      p_application_id: application.id,
    });

    if (actionError) {
      setError(actionError.message);
    } else {
      setMessage(`Application ${decision} successfully.`);
      await loadApplications();
    }

    setActionId(null);
  }

  const filteredApplications = applications.filter((application) => {
    const matchesFilter =
      filter === "all" || application.status === filter;

    const term = search.toLowerCase();
    const matchesSearch =
      application.school_name?.toLowerCase().includes(term) ||
      application.contact_name?.toLowerCase().includes(term) ||
      application.email?.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  const pendingCount = applications.filter(
    (item) => item.status === "pending"
  ).length;

  const approvedCount = applications.filter(
    (item) => item.status === "approved"
  ).length;

  const rejectedCount = applications.filter(
    (item) => item.status === "rejected"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              EduPortal Administration
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              School Applications
            </h1>
            <p className="mt-2 text-slate-500">
              Review and manage schools applying to join EduPortal.
            </p>
          </div>

          <button
            onClick={loadApplications}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Pending",
              value: pendingCount,
              icon: Clock,
              color: "text-amber-600",
            },
            {
              label: "Approved",
              value: approvedCount,
              icon: CheckCircle,
              color: "text-green-600",
            },
            {
              label: "Rejected",
              value: rejectedCount,
              icon: XCircle,
              color: "text-red-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <section
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <Icon className={item.color} size={22} />
                </div>
                <p className="mt-3 text-3xl font-bold">{item.value}</p>
              </section>
            );
          })}
        </div>

        {message && (
          <p className="mt-5 rounded-xl bg-green-50 p-4 text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search school, contact, or email..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="all">All applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <RefreshCw className="animate-spin" size={20} />
              Loading applications...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-16 text-center">
              <School className="mx-auto text-slate-300" size={42} />
              <h2 className="mt-4 font-semibold text-slate-800">
                No applications found
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Applications will appear here when schools submit them.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredApplications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-900">
                        {application.school_name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Contact: {application.contact_name}
                      </p>
                      <p className="mt-1 break-all text-sm text-slate-600">
                        Email: {application.email}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Phone: {application.phone}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Address: {application.address}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Submitted:{" "}
                        {application.created_at
                          ? new Date(application.created_at).toLocaleDateString()
                          : "Date unavailable"}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          application.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : application.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {application.status}
                      </span>

                      {application.status === "pending" && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              reviewApplication(application, "approved")
                            }
                            disabled={actionId === application.id}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionId === application.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            onClick={() =>
                              reviewApplication(application, "rejected")
                            }
                            disabled={actionId === application.id}
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default SchoolApplications;
