import { BookOpen, Plus, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";

const classes = [
  { name: "JSS 1", students: 180, subjects: 12, teacher: "Mrs. Williams" },
  { name: "JSS 2", students: 175, subjects: 12, teacher: "Mr. Hassan" },
  { name: "JSS 3", students: 168, subjects: 13, teacher: "Mr. Adewale" },
  { name: "SS 1", students: 220, subjects: 14, teacher: "Mrs. Okoro" },
  { name: "SS 2", students: 210, subjects: 14, teacher: "Mr. Johnson" },
  { name: "SS 3", students: 195, subjects: 14, teacher: "Mrs. Ibrahim" },
];

function Classes() {
  return (
    <div>
      <PageHeader
        title="Classes & subjects"
        description="Organize classes from JSS1 to SS3 and their subjects."
        action={
          <button
            type="button"
            onClick={() => alert("Class creation will be added later.")}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} /> Add class
          </button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((item) => (
          <article
            key={item.name}
            className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <BookOpen size={24} />
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Active
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              {item.name}
            </h2>

            <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={17} className="text-gray-400" />
                {item.students} students
              </p>
              <p className="text-sm text-gray-600">
                {item.subjects} subjects
              </p>
              <p className="text-sm text-gray-600">
                Class teacher: {item.teacher}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Classes;