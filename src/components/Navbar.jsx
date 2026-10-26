import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { GraduationCap, Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { name: "Home", to: "/" },
  { name: "Features", to: "/#features" },
  { name: "About", to: "/about" },
  { name: "Contact", to: "/contact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => setMenuOpen(false)}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <GraduationCap size={27} />
          </span>

          <span className="text-2xl font-extrabold tracking-tight text-gray-900">
            Edu<span className="text-blue-600">Portal</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className="text-sm font-medium text-gray-600 transition hover:text-blue-600"
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            to="/login"
            className="text-sm font-semibold text-gray-700 hover:text-blue-600"
          >
            Sign in
          </Link>

          <Link
            to="/register-school"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Register your school
            <ArrowRight size={16} />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-5 py-5 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-3 text-center font-semibold"
            >
              Sign in
            </Link>

            <Link
              to="/register-school"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white"
            >
              Register your school
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;