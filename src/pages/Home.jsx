
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Clock,
  Star,
  ChevronRight,
  School,
  Smartphone,
  FileText,
} from "lucide-react";
import { useState } from "react";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description:
        "Keep student profiles, admission numbers, class assignments, and academic records organized.",
      color: "bg-blue-100 text-blue-700",
    },
    {
      icon: ClipboardCheck,
      title: "Attendance Tracking",
      description:
        "Record daily attendance and make it easier to monitor student participation.",
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: BarChart3,
      title: "Results & Report Cards",
      description:
        "Manage continuous assessments, examination scores, grades, and printable report cards.",
      color: "bg-purple-100 text-purple-700",
    },
    {
      icon: BookOpen,
      title: "Classes & Subjects",
      description:
        "Organize classes, subjects, teachers, academic sessions, and school timetables.",
      color: "bg-amber-100 text-amber-700",
    },
    {
      icon: Smartphone,
      title: "Parent Access",
      description:
        "Give parents a convenient way to follow their children's academic progress.",
      color: "bg-pink-100 text-pink-700",
    },
    {
      icon: ShieldCheck,
      title: "Secure School Portals",
      description:
        "Give each school its own workspace, with access controlled by user roles.",
      color: "bg-indigo-100 text-indigo-700",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Apply for your school",
      description:
        "Complete the online application with your school's information.",
    },
    {
      number: "02",
      title: "Get approved",
      description:
        "Our platform team reviews your application before activation.",
    },
    {
      number: "03",
      title: "Set up your portal",
      description:
        "Configure your school profile, classes, teachers, and students.",
    },
    {
      number: "04",
      title: "Manage everything",
      description:
        "Start managing attendance, results, reports, and school records.",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-800">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-200">
              <GraduationCap size={27} />
            </span>
            <span className="text-2xl font-extrabold tracking-tight">
              Edu<span className="text-blue-600">Portal</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              How it works
            </a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              About
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sign in
            </Link>
            <Link
  to="/student-login"
  className="rounded-lg px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
>
  Student Login
</Link>
            <Link
              to="/register-school"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
            >
              Register your school <ArrowRight size={16} />
            </Link>
            
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-slate-200 p-2.5 md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-5 md:hidden">
            <nav className="flex flex-col gap-4">
              <a href="#features" onClick={() => setMenuOpen(false)} className="py-1 text-sm font-medium">
                Features
              </a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="py-1 text-sm font-medium">
                How it works
              </a>
              <a href="#about" onClick={() => setMenuOpen(false)} className="py-1 text-sm font-medium">
                About
              </a>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="py-1 text-sm font-semibold text-blue-600">
                Sign in
              </Link>
              <Link
  to="/student-login"
  className="rounded-lg px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
>
  Student Login
</Link>
              <Link
                to="/register-school"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Register your school
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <main>
        <section className="relative bg-gradient-to-b from-blue-50/80 via-white to-white">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                A smarter way to manage your school
              </div>

              <h1 className="mt-7 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Manage Your School.
                <span className="mt-2 block text-blue-600">
                  Empower Every Student.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                Bring student records, teachers, attendance, examination
                results, and school administration together in one simple
                platform built for modern schools.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register-school"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Get started <ArrowRight size={19} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Explore features <ChevronRight size={18} />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-600" />
                  Centralized school records
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-600" />
                  Access from anywhere
                </span>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />
              <div className="absolute -bottom-8 right-0 h-40 w-40 rounded-full bg-purple-200/50 blur-3xl" />

              <div className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-blue-100 sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-600 p-2.5 text-white">
                      <School size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold">School Overview</h3>
                      <p className="text-xs text-slate-500">Dashboard preview</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Preview
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-5">
                  {[
                    { label: "Students", value: "Records", icon: Users, color: "bg-blue-50 text-blue-600" },
                    { label: "Teachers", value: "Staff", icon: GraduationCap, color: "bg-purple-50 text-purple-600" },
                    { label: "Attendance", value: "Daily", icon: ClipboardCheck, color: "bg-emerald-50 text-emerald-600" },
                    { label: "Results", value: "Reports", icon: FileText, color: "bg-amber-50 text-amber-600" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-2xl border border-slate-100 p-4">
                      <div className={`mb-4 inline-flex rounded-xl p-2.5 ${color}`}>
                        <Icon size={20} />
                      </div>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 text-lg font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Academic management</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Everything in one workspace
                      </p>
                    </div>
                    <BarChart3 className="text-blue-600" size={24} />
                  </div>
                  <div className="mt-4 flex gap-1.5">
                    <div className="h-2 flex-1 rounded-full bg-blue-600" />
                    <div className="h-2 flex-1 rounded-full bg-blue-400" />
                    <div className="h-2 flex-1 rounded-full bg-blue-200" />
                    <div className="h-2 flex-1 rounded-full bg-slate-200" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Illustrative interface preview — not live school data.
                  </p>
                </div>
              </div>

              <div className="absolute -left-4 top-1/2 hidden -translate-y-1/2 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
                <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold">Role-based access</p>
                  <p className="text-xs text-slate-500">For your school team</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                Platform features
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Everything your school needs, in one place.
              </h2>
              <p className="mt-5 leading-7 text-slate-600">
                Spend less time managing scattered records and more time
                supporting students and teachers.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description, color }) => (
                <article
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50"
                >
                  <div className={`inline-flex rounded-2xl p-3 ${color}`}>
                    <Icon size={25} />
                  </div>
                  <h3 className="mt-6 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {description}
                  </p>
                  <a
                    href="#how-it-works"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
                  >
                    Learn more <ArrowRight size={16} />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                Designed for schools
              </p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">
                Your school. Your portal. Your way.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                EduPortal is being built as a multi-school management platform.
                Each approved school gets its own workspace to manage its
                records, staff, students, and academic activities.
              </p>

              <div className="mt-7 space-y-4">
                {[
                  "A separate workspace for each school",
                  "School administrators manage their own users",
                  "Academic records organized in one place",
                  "A responsive experience across devices",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                    <p className="text-sm font-medium text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="rounded-2xl bg-blue-600 p-6 text-white sm:p-8">
                <GraduationCap size={40} />
                <h3 className="mt-5 text-2xl font-extrabold">
                  Better organization starts here.
                </h3>
                <p className="mt-3 leading-7 text-blue-100">
                  Build a more connected school community with one central
                  management platform.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <Clock className="text-blue-600" size={23} />
                  <p className="mt-3 font-bold">Save time</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Organize everyday administrative work.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <ShieldCheck className="text-emerald-600" size={23} />
                  <p className="mt-3 font-bold">Control access</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Give each user the right permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                Getting started
              </p>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-950 sm:text-4xl">
                Get your school online in four steps.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                A straightforward process from application to school management.
              </p>
            </div>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ number, title, description }) => (
                <article key={number} className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-extrabold text-white shadow-lg shadow-blue-100">
                    {number}
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 pb-20 sm:px-8 sm:pb-24">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <Star size={30} className="mx-auto text-blue-200" />
            <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">
              Ready to bring your school together?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
              Apply to join EduPortal and take the next step toward a more
              organized school management experience.
            </p>
            <Link
              to="/register-school"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 font-bold text-blue-700 transition hover:bg-blue-50"
            >
              Apply for your school <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="rounded-lg bg-blue-600 p-2 text-white">
                <GraduationCap size={22} />
              </span>
              <span className="text-xl font-extrabold">
                Edu<span className="text-blue-600">Portal</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              A school management platform designed to bring school
              administration and academic records together.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Quick Links</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
              <a href="#features" className="hover:text-blue-600">Features</a>
              <a href="#how-it-works" className="hover:text-blue-600">How it works</a>
              <Link to="/login" className="hover:text-blue-600">Sign in</Link>
              <Link to="/register-school" className="hover:text-blue-600">Register a school</Link>
            <Link
  to="/student-login"
  className="rounded-lg px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
>
  Student Login
</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-slate-100 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} EduPortal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;
