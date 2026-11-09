
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Search,
  RefreshCw,
  LogOut,
  UserRound,
  Receipt,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  X,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/superbase";

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getStudentName = (student) =>
  student?.full_name ||
  student?.student_name ||
  [student?.first_name, student?.middle_name, student?.last_name]
    .filter(Boolean)
    .join(" ") ||
  "Unnamed student";

const getClassName = (student) =>
  student?.class_name ||
  student?.class_level ||
  student?.class ||
  student?.current_class ||
  "Class not set";

function SchoolBursary() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [schoolName, setSchoolName] = useState("");
  const [branding, setBranding] = useState({
    logo_url: "",
    primary_color: "#2563eb",
  });

  const primaryColor = branding.primary_color || "#2563eb";

  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    invoice_id: "",
    amount_paid: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "cash",
    reference_number: "",
    notes: "",
  });

  const loadBursary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!currentUser) {
        navigate("/bursary-login", { replace: true });
        return;
      }

      const { data: currentProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, school_id, role, status, full_name")
          .eq("id", currentUser.id)
          .single();

      if (profileError) throw profileError;

      if (
        currentProfile.role !== "bursar" ||
        currentProfile.status !== "active" ||
        !currentProfile.school_id
      ) {
        throw new Error(
          "This page is only available to an active bursar assigned to a school."
        );
      }

      setUser(currentUser);
      setProfile(currentProfile);

      // Load school name and branding
      const { data: schoolData, error: schoolError } =
        await supabase
          .from("schools")
          .select("name, logo_url, primary_color")
          .eq("id", currentProfile.school_id)
          .maybeSingle();

      if (schoolError) throw schoolError;

      setSchoolName(schoolData?.name || "School name unavailable");

      setBranding({
        logo_url: schoolData?.logo_url || "",
        primary_color: schoolData?.primary_color || "#2563eb",
      });

      const [studentResult, invoiceResult, paymentResult] =
        await Promise.all([
          supabase
            .from("students")
            .select("*")
            .eq("school_id", currentProfile.school_id)
            .order("admission_number", { ascending: true }),

          supabase
            .from("fee_invoices")
            .select("*")
            .eq("school_id", currentProfile.school_id)
            .order("created_at", { ascending: false }),

          supabase
            .from("fee_payments")
            .select("*")
            .eq("school_id", currentProfile.school_id)
            .order("payment_date", { ascending: false }),
        ]);

      if (studentResult.error) throw studentResult.error;
      if (invoiceResult.error) throw invoiceResult.error;
      if (paymentResult.error) throw paymentResult.error;

      setStudents(studentResult.data || []);
      setInvoices(invoiceResult.data || []);
      setPayments(paymentResult.data || []);
    } catch (err) {
      console.error("Bursary dashboard error:", err);
      setError(err.message || "Unable to load the bursary dashboard.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadBursary();
  }, [loadBursary]);

  const paidByInvoice = useMemo(() => {
    return payments.reduce((totals, payment) => {
      totals[payment.invoice_id] =
        (totals[payment.invoice_id] || 0) +
        Number(payment.amount_paid || 0);

      return totals;
    }, {});
  }, [payments]);

  const balances = useMemo(() => {
    return invoices.map((invoice) => {
      const paid = paidByInvoice[invoice.id] || 0;
      const due = Number(invoice.amount_due || 0);

      return {
        ...invoice,
        paid,
        balance: Math.max(0, due - paid),
      };
    });
  }, [invoices, paidByInvoice]);

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter((student) => {
      const name = getStudentName(student).toLowerCase();
      const admission = String(
        student.admission_number || ""
      ).toLowerCase();
      const studentClass = getClassName(student).toLowerCase();

      return (
        !term ||
        name.includes(term) ||
        admission.includes(term) ||
        studentClass.includes(term)
      );
    });
  }, [students, search]);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  const studentInvoices = balances.filter(
    (invoice) => invoice.student_id === selectedStudentId
  );

  const selectedInvoice = studentInvoices.find(
    (invoice) => invoice.id === paymentForm.invoice_id
  );

  const totalBilled = balances.reduce(
    (sum, invoice) => sum + Number(invoice.amount_due || 0),
    0
  );

  const totalCollected = payments.reduce(
    (sum, payment) => sum + Number(payment.amount_paid || 0),
    0
  );

  const totalOutstanding = balances.reduce(
    (sum, invoice) => sum + invoice.balance,
    0
  );

  const openPaymentForm = (studentId) => {
    setError("");
    setNotice("");
    setSelectedStudentId(studentId);

    setPaymentForm({
      invoice_id: "",
      amount_paid: "",
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "cash",
      reference_number: "",
      notes: "",
    });

    setShowPaymentForm(true);
  };

  async function handleRecordPayment(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!user || !profile?.school_id) {
      setError("Your session or school assignment is missing.");
      return;
    }

    const amount = Number(paymentForm.amount_paid);

    if (!paymentForm.invoice_id) {
      setError("Please select a fee invoice.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount greater than zero.");
      return;
    }

    if (!selectedInvoice) {
      setError("The selected invoice could not be found.");
      return;
    }

    if (amount > selectedInvoice.balance) {
      setError(
        `This payment exceeds the outstanding balance of ${money(
          selectedInvoice.balance
        )}.`
      );
      return;
    }

    if (!paymentForm.payment_date) {
      setError("Please select the payment date.");
      return;
    }

    setSaving(true);

    try {
      const { error: insertError } = await supabase
        .from("fee_payments")
        .insert({
          invoice_id: selectedInvoice.id,
          school_id: profile.school_id,
          student_id: selectedStudentId,
          amount_paid: amount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference_number:
            paymentForm.reference_number.trim() || null,
          notes: paymentForm.notes.trim() || null,
          recorded_by: user.id,
        });

      if (insertError) throw insertError;

      setNotice("Payment recorded successfully.");
      setShowPaymentForm(false);

      await loadBursary();
    } catch (err) {
      console.error("Record payment error:", err);
      setError(
        err.message ||
          "Payment could not be recorded. Check your permissions and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    navigate("/bursary-login", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto animate-spin"
            style={{ color: primaryColor }}
          />
          <p className="mt-4 text-sm text-slate-500">
            Loading bursary dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
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
                <GraduationCap size={25} />
              )}
            </div>

            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">
                {schoolName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Bursary Portal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadBursary}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Welcome banner */}
        <section
          className="rounded-2xl p-6 text-white sm:p-8"
          style={{ backgroundColor: primaryColor }}
        >
          <p className="text-sm text-white/80">Welcome back</p>

          <h2 className="mt-2 text-2xl font-extrabold">
            {schoolName}
          </h2>

          <p className="mt-1 text-sm text-white/80">
            {profile?.full_name || user?.email || "Bursar"}
          </p>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
            Record payments accurately and monitor each student's outstanding
            school fees.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            <CheckCircle size={19} />
            {notice}
          </div>
        )}

        {/* Statistics */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label: "Total Fees Billed",
              value: totalBilled,
              icon: Receipt,
            },
            {
              label: "Total Payments Recorded",
              value: totalCollected,
              icon: Banknote,
            },
            {
              label: "Outstanding Balance",
              value: totalOutstanding,
              icon: CreditCard,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-3 text-xl font-extrabold sm:text-2xl">
                      {money(stat.value)}
                    </p>
                  </div>

                  <div
                    className="rounded-xl p-3"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    }}
                  >
                    <Icon size={23} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Students and balances */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Students and Fee Balances</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search for a student to view invoices or record a payment.
              </p>
            </div>

            <span
              className="rounded-full px-3 py-1.5 text-sm font-semibold"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
              }}
            >
              {visibleStudents.length} students
            </span>
          </div>

          <div className="relative mt-5">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student name, admission number, or class..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:ring-2"
              style={{ "--tw-ring-color": primaryColor }}
            />
          </div>

          {visibleStudents.length === 0 ? (
            <div className="py-12 text-center">
              <UserRound
                size={35}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 font-semibold">No students found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try another search or confirm that students belong to your
                school.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr
                    className="border-b border-slate-200"
                    style={{ color: primaryColor }}
                  >
                    <th className="px-3 py-3 font-semibold">Student</th>
                    <th className="px-3 py-3 font-semibold">Admission No.</th>
                    <th className="px-3 py-3 font-semibold">Class</th>
                    <th className="px-3 py-3 font-semibold">Outstanding</th>
                    <th className="px-3 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleStudents.map((student) => {
                    const studentBalance = balances
                      .filter((invoice) => invoice.student_id === student.id)
                      .reduce((sum, invoice) => sum + invoice.balance, 0);

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-4 font-semibold">
                          {getStudentName(student)}
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          {student.admission_number || "—"}
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          {getClassName(student)}
                        </td>
                        <td className="px-3 py-4 font-bold">
                          {money(studentBalance)}
                        </td>
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() => openPaymentForm(student.id)}
                            className="rounded-lg px-3 py-2 font-semibold text-white hover:opacity-90"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Record Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent payments */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">Recent Payments</h2>
          <p className="mt-1 text-sm text-slate-500">
            Payments recorded for your school.
          </p>

          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No payments have been recorded yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr
                    className="border-b border-slate-200"
                    style={{ color: primaryColor }}
                  >
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Student</th>
                    <th className="px-3 py-3 font-semibold">Method</th>
                    <th className="px-3 py-3 font-semibold">Reference</th>
                    <th className="px-3 py-3 font-semibold">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.slice(0, 20).map((payment) => {
                    const student = students.find(
                      (item) => item.id === payment.student_id
                    );

                    return (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-4">
                          {payment.payment_date || "—"}
                        </td>
                        <td className="px-3 py-4 font-semibold">
                          {student ? getStudentName(student) : "Student"}
                        </td>
                        <td className="px-3 py-4 capitalize">
                          {String(payment.payment_method || "").replace(
                            "_",
                            " "
                          )}
                        </td>
                        <td className="px-3 py-4">
                          {payment.reference_number || "—"}
                        </td>
                        <td className="px-3 py-4 font-bold">
                          {money(payment.amount_paid)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Record payment modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-extrabold">
                  Record Student Payment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {getStudentName(selectedStudent)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close payment form"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={handleRecordPayment}
              className="space-y-4 p-5 sm:p-6"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Fee Invoice
                </label>

                <select
                  required
                  value={paymentForm.invoice_id}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({
                      ...previous,
                      invoice_id: event.target.value,
                      amount_paid: "",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2"
                  style={{ "--tw-ring-color": primaryColor }}
                >
                  <option value="">Select a fee invoice</option>
                  {studentInvoices.map((invoice) => (
                    <option
                      key={invoice.id}
                      value={invoice.id}
                      disabled={invoice.balance <= 0}
                    >
                      {invoice.fee_name} — {invoice.term} (
                      {invoice.academic_session}) — Balance:{" "}
                      {money(invoice.balance)}
                    </option>
                  ))}
                </select>

                {selectedInvoice && (
                  <p className="mt-2 text-sm text-slate-600">
                    Outstanding balance:{" "}
                    <strong>{money(selectedInvoice.balance)}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Amount Received (₦)
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  max={selectedInvoice?.balance || undefined}
                  step="0.01"
                  value={paymentForm.amount_paid}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({
                      ...previous,
                      amount_paid: event.target.value,
                    }))
                  }
                  placeholder="Enter amount received"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2"
                  style={{ "--tw-ring-color": primaryColor }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Payment Date
                  </label>
                  <input
                    required
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(event) =>
                      setPaymentForm((previous) => ({
                        ...previous,
                        payment_date: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2"
                    style={{ "--tw-ring-color": primaryColor }}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Payment Method
                  </label>
                  <select
                    required
                    value={paymentForm.payment_method}
                    onChange={(event) =>
                      setPaymentForm((previous) => ({
                        ...previous,
                        payment_method: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2"
                    style={{ "--tw-ring-color": primaryColor }}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="pos">POS</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Reference Number (optional)
                </label>
                <input
                  value={paymentForm.reference_number}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({
                      ...previous,
                      reference_number: event.target.value,
                    }))
                  }
                  placeholder="Receipt or transfer reference"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2"
                  style={{ "--tw-ring-color": primaryColor }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({
                      ...previous,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Additional payment details"
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2"
                  style={{ "--tw-ring-color": primaryColor }}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}
                  {saving ? "Saving Payment..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolBursary;
