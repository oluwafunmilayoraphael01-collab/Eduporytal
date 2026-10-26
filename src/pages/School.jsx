import { useState } from "react";
import { Building2, Search, CheckCircle2, XCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";

const initialSchools = [
  {
    id: 1,
    name: "Greenfield Academy",
    state: "Lagos",
    email: "greenfield@example.com",
    status: "Active",
  },
  {
    id: 2,
    name: "Bright Future College",
    state: "Ekiti",
    email: "brightfuture@example.com",
    status: "Pending",
  },
  {
    id: 3,
    name: "Royal Crest School",
    state: "FCT Abuja",
    email: "royalcrest@example.com",
    status: "Pending",
  },
  {
    id: 4,
    name: "Oakwood Secondary School",
    state: "Oyo",
    email: "oakwood@example.com",
    status: "Active",
  },
];

function Schools() {
  const [schools, setSchools] = useState(initialSchools);
  const [search, setSearch] = useState("");

  function updateStatus(id, status) {
    setSchools((current) =>
      current.map((school) =>
        school.id === id ? { ...school, status } : school
      )
    );
  }

  const filtered = schools.filter((school) =>
    `${school.name} ${school.state} ${school.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="School management"
        description="Review example school applications and their statuses."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <Building2 size={22} className="text-blue-600" />
          <p className="mt-3 text-sm text-gray-500">All schools</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {schools.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {schools.filter((school) => school.status === "Active").length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {schools.filter((school) => school.status === "Pending").length}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4 sm:p-5">
          <div className="relative max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search schools..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">School</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.map((school) => (
                <tr key={school.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800">{school.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{school.email}</p>
                  </td>

                  <td className="px-5 py-4 text-gray-600">{school.state}</td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        school.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : school.status === "Rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {school.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {school.status === "Pending" ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateStatus(school.id, "Active")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          <CheckCircle2 size={15} /> Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(school.id, "Rejected")}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Demo action complete
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                    No matching schools found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="border-t border-gray-100 px-5 py-4 text-xs leading-5 text-gray-400">
          This page uses local demonstration data. Approval changes are temporary
          and will reset when the page reloads. Real school approval must be
          enforced on the server.
        </p>
      </section>
    </div>
  );
}

export default Schools;