import { Megaphone, Plus, CalendarDays } from "lucide-react";
import PageHeader from "../components/PageHeader";

const announcements = [
  {
    title: "First term examination schedule",
    audience: "All students and teachers",
    date: "October 19, 2026",
    status: "Published",
    text: "The examination timetable will be shared with all classes after approval by the school administration.",
  },
  {
    title: "Staff meeting",
    audience: "Teaching staff",
    date: "October 21, 2026",
    status: "Draft",
    text: "Teaching staff are expected to attend the scheduled academic planning meeting.",
  },
  {
    title: "Parent information notice",
    audience: "Parents and guardians",
    date: "October 23, 2026",
    status: "Published",
    text: "Parents will receive updates about school activities and important academic dates.",
  },
];

function Announcements() {
  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Preview notices for students, staff, and parents."
        action={
          <button
            type="button"
            onClick={() =>
              alert("Creating and publishing announcements will be added later.")
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} /> Create announcement
          </button>
        }
      />

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <article
            key={announcement.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Megaphone size={22} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-bold text-gray-900">
                    {announcement.title}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      announcement.status === "Published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {announcement.status}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {announcement.text}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                  <span>{announcement.audience}</span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    {announcement.date}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Announcements;