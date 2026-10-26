import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MessageSquare, Send } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />

      <main className="bg-gray-50 px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Contact us
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Let's talk about your school.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl leading-8 text-gray-600">
              Have a question about EduPortal? Use the form below to prepare a
              message for our team.
            </p>
          </div>

          <div className="mt-12 grid overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-5">
            <aside className="bg-blue-600 p-8 text-white md:col-span-2 sm:p-10">
              <MessageSquare size={35} />
              <h2 className="mt-7 text-2xl font-bold">Get in touch</h2>
              <p className="mt-4 leading-7 text-blue-100">
                We'd like to hear your questions and learn what your school
                needs.
              </p>

              <div className="mt-8 flex items-start gap-3">
                <Mail size={20} className="mt-1 shrink-0" />
                <div>
                  <p className="font-semibold">School enquiries</p>
                  <p className="mt-1 text-sm leading-6 text-blue-100">
                    Contact details will be published when support channels
                    are configured.
                  </p>
                </div>
              </div>

              <Link
                to="/register-school"
                className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-100"
              >
                Register a school <ArrowLeft/>
              </Link>
            </aside>

            <div className="p-6 sm:p-10 md:col-span-3">
              {submitted ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="font-bold text-amber-900">
                    Frontend demonstration
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Your form passed browser validation, but no message was
                    sent. Contact form delivery will be connected later.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-4 font-semibold text-amber-900 underline"
                  >
                    Return to form
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="contactName"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Full name
                    </label>
                    <input
                      id="contactName"
                      required
                      placeholder="Your name"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contactEmail"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Email address
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contactSubject"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Subject
                    </label>
                    <input
                      id="contactSubject"
                      required
                      placeholder="How can we help?"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contactMessage"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Message
                    </label>
                    <textarea
                      id="contactMessage"
                      required
                      rows={5}
                      placeholder="Write your message..."
                      className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white hover:bg-blue-700"
                  >
                    Prepare message <Send size={17} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Contact;