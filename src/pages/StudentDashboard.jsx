
import { useEffect, useState } from "react";
import {
  GraduationCap,
  UserRound,
  BookOpen,
  ClipboardCheck,
  FileText,
  LogOut,
  LoaderCircle,
  AlertCircle,
  ArrowRight,
  Award,
  Wallet,
  Receipt,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/superbase";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // School fees
  const [feeInvoices, setFeeInvoices] = useState([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [feesError, setFeesError] = useState("");

  // School branding
  const [branding, setBranding] = useState({
    logo_url: "",
    primary_color: "#2563eb",
  });

  const [schoolName, setSchoolName] = useState("EduPortal");

  const primaryColor = branding.primary_color || "#2563eb";

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      setLoading(true);
      setError("");

      try {
        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!userData?.user) {
          navigate("/student-login", { replace: true });
          return;
        }

        // Fetch student record
        const { data, error: studentError } = await supabase
          .from("students")
          .select(
            "id, school_id, auth_user_id, first_name, middle_name, last_name, admission_number, class_name, gender, status"
          )
          .eq("auth_user_id", userData.user.id)
          .maybeSingle();

        if (studentError) throw studentError;

        if (!data) {
          throw new Error(
            "Your student record could not be found. Please contact your school administrator."
          );
        }

        // Fetch graduation class from promotion history
        let graduationClass = null;

        if (data.status?.toLowerCase() === "graduated") {
          const {
            data: promotionData,
            error: promotionError,
          } = await supabase
            .from("student_promotion_decisions")
            .select("from_class")
            .eq("student_id", data.id)
            .eq("decision_status", "executed")
            .eq("decision", "graduated")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (promotionError) throw promotionError;

          graduationClass = promotionData?.from_class || null;
        }

        if (active) {
          setStudent({
            ...data,
            graduation_class: graduationClass,
          });
        }

        // Load school branding
        const { data: schoolData, error: schoolError } =
          await supabase
            .from("schools")
            .select("name, logo_url, primary_color")
            .eq("id", data.school_id)
            .single();

        if (schoolError) {
          console.error(
            "Unable to load school branding:",
            schoolError
          );
        } else if (active) {
          setSchoolName(schoolData.name || "EduPortal");

          setBranding({
            logo_url: schoolData.logo_url || "",
            primary_color:
              schoolData.primary_color || "#2563eb",
          });
        }

        // Load student fee invoices
        try {
          const {
            data: invoiceData,
            error: invoiceError,
          } = await supabase
            .from("fee_invoices")
            .select(`
              id,
              fee_name,
              academic_session,
              term,
              amount_due,
              due_date
            `)
            .eq("student_id", data.id)
            .eq("school_id", data.school_id)
            .order("due_date", { ascending: true });

          if (invoiceError) throw invoiceError;

          const invoices = invoiceData || [];
          let payments = [];

          // Load payments belonging to these invoices
          if (invoices.length > 0) {
            const invoiceIds = invoices.map(
              (invoice) => invoice.id
            );

            const {
              data: paymentData,
              error: paymentError,
            } = await supabase
              .from("fee_payments")
              .select("invoice_id, amount_paid")
              .eq("student_id", data.id)
              .eq("school_id", data.school_id)
              .in("invoice_id", invoiceIds);

            if (paymentError) throw paymentError;

            payments = paymentData || [];
          }

          // Calculate payments per invoice
          const paymentTotals = {};

          payments.forEach((payment) => {
            const invoiceId = payment.invoice_id;

            paymentTotals[invoiceId] =
              (paymentTotals[invoiceId] || 0) +
              Number(payment.amount_paid || 0);
          });

          const updatedInvoices = invoices.map((invoice) => {
            const amountDue = Number(invoice.amount_due || 0);
            const amountPaid = paymentTotals[invoice.id] || 0;
            const balance = Math.max(0, amountDue - amountPaid);

            let paymentStatus = "Unpaid";

            if (balance === 0 && amountDue > 0) {
              paymentStatus = "Paid";
            } else if (amountPaid > 0) {
              paymentStatus = "Part-paid";
            }

            return {
              ...invoice,
              amount_paid: amountPaid,
              balance,
              payment_status: paymentStatus,
            };
          });

          if (active) {
            setFeeInvoices(updatedInvoices);
            setFeesError("");
          }
        } catch (feeErr) {
          console.error("Unable to load student fees:", feeErr);

          if (active) {
            setFeesError(
              "Unable to load your school fees. Please try again later."
            );
          }
        } finally {
          if (active) {
            setFeesLoading(false);
          }
        }
      } catch (err) {
        console.error("Unable to load student dashboard:", err);

        if (active) {
          setError(
            err.message || "Unable to load your student information."
          );
          setFeesLoading(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStudent();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      const { error: logoutError } =
        await supabase.auth.signOut();

      if (logoutError) throw logoutError;

      navigate("/student-login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Unable to log out. Please try again.");
      setLoggingOut(false);
    }
  }

  // Student information
  const studentName = student
    ? [
        student.first_name,
        student.middle_name,
        student.last_name,
      ]
        .filter(Boolean)
        .join(" ") || "Student"
    : "Student";

  const admissionNumber =
    student?.admission_number || "Not available";

  const isGraduated =
    student?.status?.toLowerCase() === "graduated";

  const graduationLevel =
    student?.graduation_class || "school";

  const studentClass = isGraduated
    ? "Graduated"
    : student?.class_name || "Not assigned";

  // Fee calculations
  const totalFees = feeInvoices.reduce(
    (total, invoice) =>
      total + Number(invoice.amount_due || 0),
    0
  );

  const totalPaid = feeInvoices.reduce(
    (total, invoice) =>
      total + Number(invoice.amount_paid || 0),
    0
  );

  const totalOutstanding = feeInvoices.reduce(
    (total, invoice) =>
      total + Number(invoice.balance || 0),
    0
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-600">
        <LoaderCircle
          size={36}
          className="animate-spin"
          style={{ color: primaryColor }}
        />
        <p className="mt-4 font-medium">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/student" className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt={schoolName}
                  className="h-full w-full object-contain"
                />
              ) : (
                <GraduationCap size={26} />
              )}
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                {schoolName}
              </h1>

              <p className="text-xs text-slate-500">
                Student Portal
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: primaryColor }}
          >
            {loggingOut ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <LogOut size={17} />
            )}

            <span>
              {loggingOut ? "Logging out..." : "Log out"}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <p
            className="text-sm font-semibold"
            style={{ color: primaryColor }}
          >
            STUDENT DASHBOARD
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Welcome, {studentName}!
          </h2>

          <p className="mt-2 text-slate-500">
            View your student information and access your school
            resources.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />
            <p>{error}</p>
          </div>
        )}

        {/* Graduate message */}
        {isGraduated && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Award size={25} />
            </div>

            <div>
              <h3 className="font-bold text-emerald-900">
                Congratulations, Graduate!
              </h3>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                You have successfully completed your school
                education. You can continue accessing your
                previous academic records and results here.
              </p>
            </div>
          </div>
        )}

        {/* Student information */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div
              className="inline-flex rounded-xl p-3"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
              }}
            >
              <UserRound size={24} />
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Student name
            </p>

            <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
              {studentName}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-xl bg-purple-50 p-3 text-purple-600">
              <GraduationCap size={24} />
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Admission number
            </p>

            <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
              {admissionNumber}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <BookOpen size={24} />
            </div>

            <p className="mt-5 text-sm text-slate-500">
              {isGraduated ? "Academic status" : "Class"}
            </p>

            <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
              {studentClass}
            </h3>
          </div>
        </section>

        {/* School Fees */}
        <section className="mt-10">
          <div className="mb-5">
            <p
              className="text-sm font-semibold"
              style={{ color: primaryColor }}
            >
              FINANCIAL INFORMATION
            </p>

            <h3 className="mt-2 text-xl font-bold text-slate-900">
              My School Fees
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              View your school fees, payments and outstanding balance.
            </p>
          </div>

          {feesLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6">
              <LoaderCircle
                size={22}
                className="animate-spin"
                style={{ color: primaryColor }}
              />
              <span className="text-sm text-slate-500">
                Loading your fee records...
              </span>
            </div>
          ) : feesError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {feesError}
            </div>
          ) : feeInvoices.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Wallet
                size={35}
                className="mx-auto text-slate-400"
              />

              <h4 className="mt-3 font-bold text-slate-900">
                No fee records yet
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Your school has not assigned any fees to your account.
              </p>
            </div>
          ) : (
            <>
              {/* Fee summary */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Receipt size={23} />
                  </div>

                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Total Fees
                  </p>

                  <h4 className="mt-2 text-2xl font-extrabold text-slate-900">
                    {formatCurrency(totalFees)}
                  </h4>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-700">
                    <Wallet size={23} />
                  </div>

                  <p className="mt-4 text-sm font-medium text-emerald-700">
                    Amount Paid
                  </p>

                  <h4 className="mt-2 text-2xl font-extrabold text-emerald-800">
                    {formatCurrency(totalPaid)}
                  </h4>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
                  <div className="inline-flex rounded-xl bg-rose-100 p-3 text-rose-700">
                    <AlertCircle size={23} />
                  </div>

                  <p className="mt-4 text-sm font-medium text-rose-700">
                    Outstanding Balance
                  </p>

                  <h4 className="mt-2 text-2xl font-extrabold text-rose-800">
                    {formatCurrency(totalOutstanding)}
                  </h4>
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                  <h4 className="font-bold text-slate-900">
                    Fee Breakdown
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Your assigned fees and payment records.
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {feeInvoices.map((invoice) => (
                    <div key={invoice.id} className="p-5">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <h5 className="font-bold text-slate-900">
                            {invoice.fee_name}
                          </h5>

                          <p className="mt-1 text-sm text-slate-500">
                            {invoice.academic_session}
                            {invoice.term
                              ? ` • ${invoice.term}`
                              : ""}
                          </p>

                          {invoice.due_date && (
                            <p className="mt-1 text-xs text-slate-400">
                              Due:{" "}
                              {new Date(
                                `${invoice.due_date}T00:00:00`
                              ).toLocaleDateString("en-NG")}
                            </p>
                          )}
                        </div>

                        <div className="sm:text-right">
                          <p className="font-bold text-slate-900">
                            {formatCurrency(invoice.amount_due)}
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              invoice.payment_status === "Paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : invoice.payment_status === "Part-paid"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {invoice.payment_status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                        <div>
                          <p className="text-xs text-slate-500">
                            Amount paid
                          </p>

                          <p className="mt-1 text-sm font-bold text-emerald-700">
                            {formatCurrency(invoice.amount_paid)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Outstanding
                          </p>

                          <p className="mt-1 text-sm font-bold text-rose-700">
                            {formatCurrency(invoice.balance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* School resources */}
        <section className="mt-10">
          <h3 className="text-xl font-bold text-slate-900">
            Your school resources
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {isGraduated
              ? "Access your previous academic records and examination results."
              : "Access your attendance, examination results, and academic information."}
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {!isGraduated && (
              <Link
                to="/student/attendance"
                className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = primaryColor)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "")
                }
              >
                <div
                  className="inline-flex rounded-xl p-3"
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                  }}
                >
                  <ClipboardCheck size={23} />
                </div>

                <h4 className="mt-4 font-bold text-slate-900">
                  Attendance
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  View your attendance percentage, absences,
                  and daily records.
                </p>

                <span
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: `${primaryColor}18`,
                    color: primaryColor,
                  }}
                >
                  View attendance
                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-1"
                  />
                </span>
              </Link>
            )}

            <Link
              to="/student/results"
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = primaryColor)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "")
              }
            >
              <div
                className="inline-flex rounded-xl p-3"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                }}
              >
                <FileText size={23} />
              </div>

              <h4 className="mt-4 font-bold text-slate-900">
                Results &amp; Reports
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Access examination results, subject scores,
                and grades.
              </p>

              <span
                className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${primaryColor}18`,
                  color: primaryColor,
                }}
              >
                View results
                <ArrowRight
                  size={14}
                  className="transition group-hover:translate-x-1"
                />
              </span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {schoolName}. All rights reserved.
      </footer>
    </div>
  );
}
