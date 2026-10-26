import { GraduationCap, ShieldCheck, Users, Target } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function About() {
  const values = [
    {
      icon: Target,
      title: "Simplicity",
      text: "Make everyday school administration easier to understand and manage.",
    },
    {
      icon: Users,
      title: "Collaboration",
      text: "Bring administrators, teachers, students, and parents into a more organized school experience.",
    },
    {
      icon: ShieldCheck,
      title: "Responsible access",
      text: "Design clear roles and permissions so each user can access the information relevant to them.",
    },
  ];

  return (
    <>
      <Navbar />

      <main>
        <section className="bg-blue-50/70 px-5 py-20 text-center sm:py-28">
          <GraduationCap size={48} className="mx-auto text-blue-600" />
          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-blue-600">
            About EduPortal
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Helping schools focus on what matters most.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl leading-8 text-gray-600">
            EduPortal is being built to help secondary schools organize their
            administrative and academic activities in one modern platform.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                One platform. A more organized school.
              </h2>
              <p className="mt-5 leading-8 text-gray-600">
                School administration involves student records, staff
                information, results, attendance, academic calendars, and fee
                records. EduPortal aims to bring these tasks into a structured
                digital workspace.
              </p>
              <p className="mt-4 leading-8 text-gray-600">
                The platform is planned as a multi-school service, with a
                separate workspace for each approved school.
              </p>
            </div>

            <div className="rounded-3xl bg-gray-950 p-8 text-white sm:p-10">
              <GraduationCap size={40} className="text-blue-400" />
              <h3 className="mt-6 text-2xl font-bold">
                Manage Your School. Empower Every Student.
              </h3>
              <p className="mt-4 leading-7 text-gray-300">
                Our goal is to make school information easier to organize,
                access, and use responsibly.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              What guides us
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {values.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-gray-200 bg-white p-7"
                >
                  <Icon size={28} className="text-blue-600" />
                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    {title}
                  </h3>
                  <p className="mt-3 leading-7 text-gray-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default About;