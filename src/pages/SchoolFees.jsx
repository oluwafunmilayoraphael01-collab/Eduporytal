
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  History,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  X,
  Users,
} from "lucide-react";
import { supabase } from "../lib/superbase";

const initialInvoiceForm = {
  class_name: "",
  student_id: "",
  fee_name: "",
  academic_session: "2026/2027",
  term: "First Term",
  amount_due: "",
  due_date: "",
  notes: "",
};

const initialPaymentForm = {
  amount_paid: "",
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: "bank_transfer",
  reference_number: "",
  notes: "",
};

const classOptions = [
  { label: "JSS1", value: "JSS1", group: "Junior Secondary" },
  { label: "JSS2", value: "JSS2", group: "Junior Secondary" },
  { label: "JSS3", value: "JSS3", group: "Junior Secondary" },
  { label: "SS1", value: "SS1", group: "Senior Secondary" },
  { label: "SS2", value: "SS2", group: "Senior Secondary" },
  { label: "SS3", value: "SS3", group: "Senior Secondary" },
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const getStudentName = (student) => {
  if (!student) return "Unknown student";

  return (
    student.full_name ||
    student.name ||
    [student.first_name, student.last_name].filter(Boolean).join(" ") ||
    student.student_name ||
    student.admission_number ||
    "Unnamed student"
  );
};

const getStudentClass = (student) =>
  student?.class_name ||
  student?.class ||
  student?.class_level ||
  "";

const normalizeClass = (value) =>
  String(value || "").trim().toUpperCase().replace(/\s+/g, "");

const isExamClass = (className) =>
  ["JSS3", "SS3"].includes(normalizeClass(className));

export default function SchoolFees() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [schoolId, setSchoolId] = useState("");
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const [search, setSearch] = useState("");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData.user;

      if (!user) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("school_id, role, status")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== "school_admin") {
        throw new Error("Only school administrators can access this page.");
      }

      if (profile.status && profile.status !== "active") {
        throw new Error("Your administrator account is not active.");
      }

      if (!profile.school_id) {
        throw new Error("Your account is not linked to a school.");
      }

      setSchoolId(profile.school_id);

      const [
        { data: studentRows, error: studentsError },
        { data: invoiceRows, error: invoicesError },
        { data: paymentRows, error: paymentsError },
      ] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .eq("school_id", profile.school_id)
          .order("admission_number", { ascending: true }),

        supabase
          .from("fee_invoices")
          .select("*")
          .eq("school_id", profile.school_id)
          .order("created_at", { ascending: false }),

        supabase
          .from("fee_payments")
          .select("*")
          .eq("school_id", profile.school_id)
          .order("payment_date", { ascending: false }),
      ]);

      if (studentsError) throw studentsError;
      if (invoicesError) throw invoicesError;
      if (paymentsError) throw paymentsError;

      setStudents(studentRows || []);
      setInvoices(invoiceRows || []);
      setPayments(paymentRows || []);
    } catch (err) {
      setError(err.message || "Unable to load fees data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const studentsInSelectedClass = useMemo(() => {
    if (!invoiceForm.class_name) return [];

    return students.filter(
      (student) =>
        normalizeClass(getStudentClass(student)) ===
        normalizeClass(invoiceForm.class_name)
    );
  }, [students, invoiceForm.class_name]);

  const paymentTotals = useMemo(() => {
    const totals = {};

    payments.forEach((payment) => {
      totals[payment.invoice_id] =
        (totals[payment.invoice_id] || 0) +
        Number(payment.amount_paid || 0);
    });

    return totals;
  }, [payments]);

  const invoiceDetails = useMemo(
    () =>
      invoices.map((invoice) => {
        const student = students.find(
          (item) => item.id === invoice.student_id
        );

        const paid = paymentTotals[invoice.id] || 0;
        const due = Number(invoice.amount_due || 0);
        const balance = Math.max(0, due - paid);

        return {
          ...invoice,
          student,
          studentName: getStudentName(student),
          admissionNumber: student?.admission_number || "—",
          className: getStudentClass(student) || "Class not set",
          paid,
          balance,
          paymentStatus:
            balance <= 0 ? "Paid" : paid > 0 ? "Part-paid" : "Unpaid",
        };
      }),
    [invoices, students, paymentTotals]
  );

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return invoiceDetails;

    return invoiceDetails.filter((invoice) =>
      [
        invoice.studentName,
        invoice.admissionNumber,
        invoice.className,
        invoice.fee_name,
        invoice.academic_session,
        invoice.term,
        invoice.paymentStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [invoiceDetails, search]);

  const totalBilled = invoiceDetails.reduce(
    (sum, invoice) => sum + Number(invoice.amount_due || 0),
    0
  );

  const totalCollected = invoiceDetails.reduce(
    (sum, invoice) => sum + invoice.paid,
    0
  );

  const totalOutstanding = invoiceDetails.reduce(
    (sum, invoice) => sum + invoice.balance,
    0
  );

  const updateInvoiceField = (event) => {
    const { name, value } = event.target;

    setInvoiceForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updatePaymentField = (event) => {
    const { name, value } = event.target;

    setPaymentForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const openInvoiceForm = () => {
    setError("");
    setSuccess("");
    setInvoiceForm(initialInvoiceForm);
    setShowInvoiceForm(true);
  };

  const createInvoice = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!schoolId) {
      setError("School information is unavailable. Reload the page.");
      return;
    }

    if (!invoiceForm.class_name) {
      setError("Please select a class.");
      return;
    }

    if (
      !invoiceForm.student_id &&
      studentsInSelectedClass.length === 0
    ) {
      setError("There are no students in the selected class.");
      return;
    }

    if (!invoiceForm.fee_name.trim()) {
      setError("Please enter a fee name.");
      return;
    }

    const amount = Number(invoiceForm.amount_due);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid fee amount greater than zero.");
      return;
    }

    const targetStudents = invoiceForm.student_id
      ? studentsInSelectedClass.filter(
          (student) => student.id === invoiceForm.student_id
        )
      : studentsInSelectedClass;

    if (targetStudents.length === 0) {
      setError("No matching student was found for the selected class.");
      return;
    }

    const invoiceRows = targetStudents.map((student) => ({
      school_id: schoolId,
      student_id: student.id,
      fee_name: invoiceForm.fee_name.trim(),
      academic_session: invoiceForm.academic_session.trim(),
      term: invoiceForm.term,
      amount_due: amount,
      due_date: invoiceForm.due_date || null,
      notes: invoiceForm.notes.trim() || null,
    }));

    setSaving(true);

    try {
      const { error: insertError } = await supabase
        .from("fee_invoices")
        .insert(invoiceRows);

      if (insertError) throw insertError;

      setSuccess(
        `Invoice created successfully for ${targetStudents.length} student${
          targetStudents.length === 1 ? "" : "s"
        } in ${invoiceForm.class_name}.`
      );

      setInvoiceForm(initialInvoiceForm);
      setShowInvoiceForm(false);
      await loadData();
    } catch (err) {
      if (err.code === "23505") {
        setError(
          "At least one student already has an invoice with this fee name, session and term. Check existing invoices before trying again."
        );
      } else {
        setError(err.message || "Could not create the invoice.");
      }
    } finally {
      setSaving(false);
    }
  };

  const openPaymentForm = (invoice) => {
    setSelectedInvoice(invoice);

    setPaymentForm({
      ...initialPaymentForm,
      amount_paid: String(invoice.balance),
      payment_date: new Date().toISOString().slice(0, 10),
    });

    setError("");
    setSuccess("");
  };

  const recordPayment = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedInvoice) return;

    const amount = Number(paymentForm.amount_paid);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount greater than zero.");
      return;
    }

    if (amount > selectedInvoice.balance) {
      setError(
        `Payment cannot exceed the outstanding balance of ${formatMoney(
          selectedInvoice.balance
        )}.`
      );
      return;
    }

    setSaving(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) throw new Error("Please log in again.");

      const { error: insertError } = await supabase
        .from("fee_payments")
        .insert({
          invoice_id: selectedInvoice.id,
          school_id: schoolId,
          student_id: selectedInvoice.student_id,
          amount_paid: amount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number.trim() || null,
          notes: paymentForm.notes.trim() || null,
          recorded_by: authData.user.id,
        });

      if (insertError) throw insertError;

      setSuccess("Payment recorded successfully.");
      setSelectedInvoice(null);
      setPaymentForm(initialPaymentForm);
      await loadData();
    } catch (err) {
      setError(err.message || "Could not record the payment.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "Paid") return "bg-green-100 text-green-700";
    if (status === "Part-paid") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
        <LoaderCircle className="animate-spin" size={22} />
        Loading school fees...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              School Administration
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Fees & Payments
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage class fees, external examination charges and student payments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={openInvoiceForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Create invoice
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total invoices"
            value={invoices.length}
            icon={<FileText size={22} />}
            color="blue"
          />
          <SummaryCard
            title="Total billed"
            value={formatMoney(totalBilled)}
            icon={<CircleDollarSign size={22} />}
            color="indigo"
          />
          <SummaryCard
            title="Total collected"
            value={formatMoney(totalCollected)}
            icon={<Wallet size={22} />}
            color="green"
          />
          <SummaryCard
            title="Outstanding"
            value={formatMoney(totalOutstanding)}
            icon={<AlertCircle size={22} />}
            color="amber"
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Student fee invoices
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredInvoices.length} invoice(s) displayed
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, class or fee..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="mx-auto text-slate-300" size={38} />
              <h3 className="mt-3 font-semibold text-slate-800">
                No invoices found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Create an invoice or change your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Fee</th>
                    <th className="px-5 py-4">Session / Term</th>
                    <th className="px-5 py-4">Amount due</th>
                    <th className="px-5 py-4">Paid</th>
                    <th className="px-5 py-4">Balance</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {invoice.studentName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {invoice.admissionNumber} · {invoice.className}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {invoice.fee_name}
                        {isExamClass(invoice.className) &&
                          invoice.fee_name
                            .toLowerCase()
                            .includes("exam") && (
                            <p className="mt-1 text-xs font-medium text-amber-700">
                              External examination fee
                            </p>
                          )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {invoice.academic_session}
                        <p className="mt-1 text-xs text-slate-500">
                          {invoice.term}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {formatMoney(invoice.amount_due)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-green-700">
                        {formatMoney(invoice.paid)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                        {formatMoney(invoice.balance)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            invoice.paymentStatus
                          )}`}
                        >
                          {invoice.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={invoice.balance <= 0}
                          onClick={() => openPaymentForm(invoice)}
                          className="whitespace-nowrap rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Record payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-4">
            <History className="text-blue-600" size={21} />
            <div>
              <h2 className="font-semibold text-slate-900">Recent payments</h2>
              <p className="text-sm text-slate-500">
                Latest manually recorded transactions
              </p>
            </div>
          </div>

          {payments.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No payments have been recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.slice(0, 10).map((payment) => {
                    const invoice = invoices.find(
                      (item) => item.id === payment.invoice_id
                    );
                    const student = students.find(
                      (item) => item.id === payment.student_id
                    );

                    return (
                      <tr key={payment.id}>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {payment.payment_date}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {getStudentName(student)}
                          <p className="mt-1 text-xs font-normal text-slate-500">
                            {invoice?.fee_name || "Fee payment"}
                          </p>
                        </td>
                        <td className="px-5 py-4 capitalize text-slate-600">
                          {payment.payment_method.replaceAll("_", " ")}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {payment.reference_number || "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-green-700">
                          {formatMoney(payment.amount_paid)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showInvoiceForm && (
          <Modal
            title="Create class fee invoice"
            onClose={() => setShowInvoiceForm(false)}
          >
            <form onSubmit={createInvoice} className="space-y-4">
              <Field label="Class">
                <select
                  required
                  name="class_name"
                  value={invoiceForm.class_name}
                  onChange={(event) =>
                    setInvoiceForm((current) => ({
                      ...current,
                      class_name: event.target.value,
                      student_id: "",
                      fee_name: isExamClass(event.target.value)
                        ? current.fee_name
                        : current.fee_name,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Select a class</option>
                  <optgroup label="Junior Secondary">
                    <option value="JSS1">JSS1</option>
                    <option value="JSS2">JSS2</option>
                    <option value="JSS3">JSS3 — external examinations</option>
                  </optgroup>
                  <optgroup label="Senior Secondary">
                    <option value="SS1">SS1</option>
                    <option value="SS2">SS2</option>
                    <option value="SS3">SS3 — external examinations</option>
                  </optgroup>
                </select>
              </Field>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-semibold">
                  {isExamClass(invoiceForm.class_name)
                    ? `${invoiceForm.class_name} examination class`
                    : invoiceForm.class_name
                    ? `${invoiceForm.class_name} regular class`
                    : "Choose a class to begin"}
                </p>
                <p className="mt-1">
                  {isExamClass(invoiceForm.class_name)
                    ? "You can create a separate external examination invoice for this class."
                    : "This invoice will be assigned to students in the selected class."}
                </p>
              </div>

              <Field label="Apply invoice to">
                <select
                  value={invoiceForm.student_id}
                  onChange={updateInvoiceField}
                  name="student_id"
                  disabled={!invoiceForm.class_name}
                  className={inputClass}
                >
                  <option value="">All students in this class</option>
                  {studentsInSelectedClass.map((student) => (
                    <option key={student.id} value={student.id}>
                      {getStudentName(student)} —{" "}
                      {student.admission_number || "No admission number"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Choose one student or leave it at “All students in this class”.
                </p>
              </Field>

              {invoiceForm.class_name &&
                studentsInSelectedClass.length === 0 && (
                  <p className="text-sm text-amber-700">
                    No students found in {invoiceForm.class_name}. Check the
                    class names stored in your students table.
                  </p>
                )}

              <Field label="Fee name">
                <input
                  required
                  name="fee_name"
                  value={invoiceForm.fee_name}
                  onChange={updateInvoiceField}
                  placeholder={
                    isExamClass(invoiceForm.class_name)
                      ? "e.g. School Fees or External Examination Fee"
                      : "e.g. School Fees"
                  }
                  className={inputClass}
                />
              </Field>

              {isExamClass(invoiceForm.class_name) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setInvoiceForm((current) => ({
                        ...current,
                        fee_name: "School Fees",
                      }))
                    }
                    className="rounded-lg border border-slate-200 p-3 text-left text-sm hover:border-blue-400 hover:bg-blue-50"
                  >
                    <span className="block font-semibold">Regular fees</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Normal school charges
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInvoiceForm((current) => ({
                        ...current,
                        fee_name: "External Examination Fee",
                      }))
                    }
                    className="rounded-lg border border-amber-200 p-3 text-left text-sm hover:bg-amber-50"
                  >
                    <span className="block font-semibold text-amber-800">
                      External examination
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Separate exam charge
                    </span>
                  </button>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Academic session">
                  <input
                    required
                    name="academic_session"
                    value={invoiceForm.academic_session}
                    onChange={updateInvoiceField}
                    className={inputClass}
                  />
                </Field>

                <Field label="Term">
                  <select
                    required
                    name="term"
                    value={invoiceForm.term}
                    onChange={updateInvoiceField}
                    className={inputClass}
                  >
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount due (₦)">
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    name="amount_due"
                    value={invoiceForm.amount_due}
                    onChange={updateInvoiceField}
                    placeholder="e.g. 150000"
                    className={inputClass}
                  />
                </Field>

                <Field label="Due date (optional)">
                  <input
                    type="date"
                    name="due_date"
                    value={invoiceForm.due_date}
                    onChange={updateInvoiceField}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Notes (optional)">
                <textarea
                  rows="2"
                  name="notes"
                  value={invoiceForm.notes}
                  onChange={updateInvoiceField}
                  className={inputClass}
                  placeholder="Additional information"
                />
              </Field>

              <ModalActions
                saving={saving}
                submitLabel="Create invoice"
                onCancel={() => setShowInvoiceForm(false)}
                disabled={
                  !invoiceForm.class_name ||
                  studentsInSelectedClass.length === 0
                }
              />
            </form>
          </Modal>
        )}

        {selectedInvoice && (
          <Modal
            title="Record student payment"
            onClose={() => setSelectedInvoice(null)}
          >
            <div className="mb-5 rounded-lg bg-blue-50 p-4">
              <p className="font-semibold text-slate-900">
                {selectedInvoice.studentName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedInvoice.fee_name} · {selectedInvoice.term}
              </p>
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-slate-600">Outstanding balance</span>
                <span className="font-bold text-blue-700">
                  {formatMoney(selectedInvoice.balance)}
                </span>
              </div>
            </div>

            <form onSubmit={recordPayment} className="space-y-4">
              <Field label="Amount paid (₦)">
                <input
                  required
                  type="number"
                  min="0.01"
                  max={selectedInvoice.balance}
                  step="0.01"
                  name="amount_paid"
                  value={paymentForm.amount_paid}
                  onChange={updatePaymentField}
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Payment date">
                  <input
                    required
                    type="date"
                    name="payment_date"
                    value={paymentForm.payment_date}
                    onChange={updatePaymentField}
                    className={inputClass}
                  />
                </Field>

                <Field label="Payment method">
                  <select
                    required
                    name="payment_method"
                    value={paymentForm.payment_method}
                    onChange={updatePaymentField}
                    className={inputClass}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="pos">POS</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>

              <Field label="Reference number (optional)">
                <input
                  name="reference_number"
                  value={paymentForm.reference_number}
                  onChange={updatePaymentField}
                  placeholder="Transaction or receipt reference"
                  className={inputClass}
                />
              </Field>

              <Field label="Notes (optional)">
                <textarea
                  rows="2"
                  name="notes"
                  value={paymentForm.notes}
                  onChange={updatePaymentField}
                  className={inputClass}
                  placeholder="e.g. Payment received from parent"
                />
              </Field>

              <ModalActions
                saving={saving}
                submitLabel="Save payment"
                onCancel={() => setSelectedInvoice(null)}
              />
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function SummaryCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg p-2.5 ${colors[color]}`}>{icon}</div>
      </div>
      <p className="mt-4 break-words text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  saving,
  submitLabel,
  onCancel,
  disabled = false,
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving || disabled}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving && <LoaderCircle size={17} className="animate-spin" />}
        {saving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
