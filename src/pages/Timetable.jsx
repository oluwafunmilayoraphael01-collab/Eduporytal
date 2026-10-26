import { Clock3 } from "lucide-react";
import PageHeader from "../components/PageHeader";

const timetable = [
  ["8:00–8:40", "Mathematics", "English", "Basic Science", "Mathematics", "English"],
  ["8:40–9:20", "English", "Mathematics", "English", "Computer Studies", "Basic Science"],
  ["9:20–10:00", "Basic Science", "Social Studies", "Mathematics", "English", "Computer Studies"],
  ["10:30–11:10", "Computer Studies", "Basic Science", "Social Studies", "Mathematics", "Social Studies"],
  ["11:10–11:50", "Social Studies", "Computer Studies", "English", "Basic Science", "Mathematics"],
];

function Timetable() {
  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Example weekly class schedule."
      />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Clock3 size={22} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">JSS 1 timetable</h2>
            <p className="mt-1 text-sm text-gray-500">
              2026/2027 · First term
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-center text-sm">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
              <tr>
                {["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                  (day) => (
                    <th key={day} className="px-4 py-4">
                      {day}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {timetable.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => (
                    <td
                      key={`${row[0]}-${index}`}
                      className={`px-4 py-5 ${
                        index === 0
                          ? "bg-gray-50 font-semibold text-gray-600"
                          : "text-gray-700"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="border-t border-gray-100 px-5 py-4 text-xs text-gray-400">
          Sample timetable only. Scheduling and timetable editing will be
          implemented later.
        </p>
      </section>
    </div>
  );
}

export default Timetable;