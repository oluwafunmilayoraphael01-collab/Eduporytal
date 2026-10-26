import { GraduationCap, Mail, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-600 p-2 text-white">
              <GraduationCap size={23} />
            </span>
            <span className="text-xl font-extrabold text-gray-900">
              Edu<span className="text-blue-600">Portal</span>
            </span>
          </Link>

          <p className="mt-4 max-w-xs text-sm leading-7 text-gray-500">
            A smarter way to manage schools, support teachers, and help students
            succeed.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-gray-900">Platform</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500">
            <Link to="/#features" className="hover:text-blue-600">
              Features
            </Link>
            <Link to="/register-school" className="hover:text-blue-600">
              Register a school
            </Link>
            <Link to="/login" className="hover:text-blue-600">
              Sign in
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-900">Company</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500">
            <Link to="/about" className="hover:text-blue-600">
              About us
            </Link>
            <Link to="/contact" className="hover:text-blue-600">
              Contact
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-900">Get in touch</h3>
          <p className="mt-4 text-sm leading-6 text-gray-500">
            Have questions about bringing your school to EduPortal?
          </p>
          <Link
            to="/contact"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Contact our team <ArrowUpRight size={16} />
          </Link>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Mail size={16} /> School support
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} EduPortal. All rights reserved.</p>
          <p>Built for better education.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;