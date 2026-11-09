
import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  GraduationCap,
  UserRound,
  KeyRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/superbase";

const emptyForm = {
  admission_number: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "",
  date_of_birth: "",
  class_name: "",
  guardian_name: "",
  guardian_phone: "",
  address: "",
  status: "active",
  password: "",
};

const primaryClasses = [
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
];

const secondaryClasses = [
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SSS 1",
  "SSS 2",
  "SSS 3",
];

function Student() {
  const { profile } = useAuth();

  const [students, setStudents] = useState([]);
  const [graduationRecords, setGraduationRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // School branding
  const [branding, setBranding] = useState({
    logo_url: "",
    primary_color: "#2563eb",
  });

  const [schoolName, setSchoolName] = useState("");

  // School type and Nursery classes
  const [schoolType, setSchoolType] = useState(null);
  const [nurseryClasses, setNurseryClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const primaryColor = branding.primary_color || "#2563eb";

  // Available classes depend on the school's registered type
  const availableClasses = [
    ...(schoolType === "primary" || schoolType === "both"
      ? nurseryClasses.map((item) => item.class_name)
      : []),

    ...(schoolType === "primary" || schoolType === "both"
      ? primaryClasses
      : []),

    ...(schoolType === "secondary" || schoolType === "both"
      ? secondaryClasses
      : []),
  ];

  // Load school information and Nursery classes
  useEffect(() => {
    async function loadSchoolInformation() {
      if (!profile?.school_id) {
        setClassesLoading(false);
        return;
      }

      setClassesLoading(true);
      setNurseryClasses([]);

      try {
        const { data: schoolData, error: schoolError } = await supabase
          .from("schools")
          .select("name, logo_url, primary_color, school_type")
          .eq("id", profile.school_id)
          .single();

        if (schoolError) throw schoolError;

        setSchoolName(schoolData.name || "");
        setSchoolType(schoolData.school_type || null);

        setBranding({
          logo_url: schoolData.logo_url || "",
          primary_color: schoolData.primary_color || "#2563eb",
        });

        if (
          schoolData.school_type === "primary" ||
          schoolData.school_type === "both"
        ) {
          const { data: classData, error: classError } = await supabase
            .from("school_classes")
            .select("id, class_name")
            .eq("school_id", profile.school_id)
            .eq("section", "nursery")
            .eq("is_active", true)
            .order("created_at", { ascending: true });

          if (classError) throw classError;

          setNurseryClasses(classData || []);
        } else {
          setNurseryClasses([]);
        }
      } catch (err) {
        console.error("Could not load school information:", err);
        setError(err.message || "Could not load school information.");
      } finally {
        setClassesLoading(false);
      }
    }

    loadSchoolInformation();
  }, [profile?.school_id]);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition";

  // Load students and graduation records
  const loadStudents = useCallback(async () => {
    if (!supabase || !profile?.school_id) {
      setStudents([]);
      setGraduationRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [studentsResult, graduationResult] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .eq("school_id", profile.school_id)
          .order("created_at", { ascending: false }),

        supabase
          .from("student_promotion_decisions")
          .select("*")
          .eq("school_id", profile.school_id)
          .eq("decision", "graduated")
          .eq("decision_status", "executed")
          .order("created_at", { ascending: false }),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (graduationResult.error) throw graduationResult.error;

      setStudents(studentsResult.data || []);
      setGraduationRecords(graduationResult.data || []);
    } catch (err) {
      console.error("Could not load students:", err);
      setError(err.message || "Could not load students.");
    } finally {
      setLoading(false);
    }
  }, [profile?.school_id]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  function openAddForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setMessage("");
    setError("");
    setFormOpen(true);
  }

  function openEditForm(student) {
    if (student.status === "graduated") return;

    setForm({
      ...emptyForm,
      ...student,
      password: "",
      date_of_birth: student.date_of_birth || "",
      middle_name: student.middle_name || "",
      gender: student.gender || "",
      guardian_name: student.guardian_name || "",
      guardian_phone: student.guardian_phone || "",
      address: student.address || "",
    });

    setEditingId(student.id);
    setMessage("");
    setError("");
    setFormOpen(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    if (!profile?.school_id) {
      setError("Your account is not assigned to a school.");
      return;
    }

    if (classesLoading) {
      setError("Please wait while school classes are loading.");
      return;
    }

    if (!schoolType) {
      setError(
        "Your school's type has not been configured. Contact the platform administrator."
      );
      return;
    }

    if (!availableClasses.includes(form.class_name)) {
      setError("Please select a valid class for your school.");
      return;
    }

    if (!editingId && form.password.length < 8) {
      setError("Initial password must contain at least 8 characters.");
      return;
    }

    if (form.password.length > 128) {
      setError("Password cannot exceed 128 characters.");
      return;
    }

    setSaving(true);

    try {
      const studentData = {
        admission_number: form.admission_number.trim().toUpperCase(),
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || null,
        last_name: form.last_name.trim(),
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        class_name: form.class_name.trim(),
        guardian_name: form.guardian_name.trim() || null,
        guardian_phone: form.guardian_phone.trim() || null,
        address: form.address.trim() || null,
        status: form.status,
      };

      if (editingId) {
        const existingStudent = students.find(
          (student) => student.id === editingId
        );

        if (existingStudent?.status === "graduated") {
          throw new Error("Graduated student records cannot be edited here.");
        }

        const { data, error: updateError } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", editingId)
          .eq("school_id", profile.school_id)
          .eq("status", "active")
          .select()
          .maybeSingle();

        if (updateError) throw updateError;

        if (!data) {
          throw new Error(
            "Student could not be updated. Check permissions or student status."
          );
        }

        setMessage("Student updated successfully.");
      } else {
        const { data, error: functionError } =
          await supabase.functions.invoke("create-student-account", {
            body: {
              ...studentData,
              password: form.password,
            },
          });

        if (functionError) {
          let message = functionError.message;

          try {
            const details = await functionError.context?.json();
            if (details?.error) message = details.error;
          } catch {
            // Keep original error.
          }

          throw new Error(message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (!data?.student) {
          throw new Error(
            "The student account was not created. Check your Edge Function."
          );
        }

        setMessage(
          `Student ${data.student.admission_number} registered successfully. Share the admission number and initial password securely.`
        );
      }

      setFormOpen(false);
      setForm({ ...emptyForm });
      setEditingId(null);

      await loadStudents();
    } catch (err) {
      console.error("Student save error:", err);
      setError(err?.message || "Could not save the student.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(student) {
    if (student.status === "graduated") {
      setError("Graduated students cannot be deleted from this page.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${student.first_name} ${student.last_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id)
        .eq("school_id", profile.school_id)
        .neq("status", "graduated");

      if (deleteError) throw deleteError;

      setStudents((previous) =>
        previous.filter((item) => item.id !== student.id)
      );

      setMessage("Student record deleted successfully.");
    } catch (err) {
      console.error("Student delete error:", err);
      setError("Could not delete this student. Please try again.");
    }
  }

  const activeStudents = students.filter(
    (student) => student.status === "active"
  );

  const inactiveStudents = students.filter(
    (student) => student.status === "inactive"
  );

  const graduatedStudents = students.filter(
    (student) => student.status === "graduated"
  );

  const statusCounts = {
    all: students.length,
    active: activeStudents.length,
    inactive: inactiveStudents.length,
    graduated: graduatedStudents.length,
  };

  const searchText = search.trim().toLowerCase();

  const filteredStudents = students.filter((student) => {
    const matchesStatus =
      selectedStatus === "all" || student.status === selectedStatus;

    const matchesSearch = [
      student.first_name,
      student.middle_name,
      student.last_name,
      student.admission_number,
      student.class_name,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(searchText)
      );

    return matchesStatus && matchesSearch;
  });

  const graduationSession = (studentId) => {
    const record = graduationRecords.find(
      (item) => item.student_id === studentId
    );

    return record?.academic_session || "History unavailable";
  };

  const tabs = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Graduated", value: "graduated" },
  ];

  const stats = [
    {
      label: "All Students",
      value: statusCounts.all,
      color: "bg-slate-100",
      icon: Users,
      status: "all",
    },
    {
      label: "Active Students",
      value: statusCounts.active,
      color: "bg-green-50 text-green-600",
      icon: UserRound,
      status: "active",
    },
    {
      label: "Inactive Students",
      value: statusCounts.inactive,
      color: "bg-orange-50 text-orange-600",
      icon: Users,
      status: "inactive",
    },
    {
      label: "Graduated Students",
      value: statusCounts.graduated,
      color: "bg-purple-50 text-purple-600",
      icon: GraduationCap,
      status: "graduated",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/school"
            className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80"
            style={{ color: primaryColor }}
          >
            <GraduationCap size={19} />
            Back to School Dashboard
          </Link>

          <div className="flex items-center gap-3">
            {branding.logo_url && (
              <img
                src={branding.logo_url}
                alt="School logo"
                className="h-11 w-11 rounded-xl border border-slate-200 object-contain bg-white"
              />
            )}
            <span className="font-bold text-slate-700">{schoolName}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              Students
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Register and manage your school's student records and login
              accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={19} />
            Add Student
          </button>
        </div>

        {message && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-3 font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <button
                key={stat.status}
                type="button"
                onClick={() => setSelectedStatus(stat.status)}
                className={`flex items-center gap-4 rounded-2xl border bg-white p-5 text-left transition hover:shadow-md ${
                  selectedStatus === stat.status
                    ? "border-2"
                    : "border-slate-200"
                }`}
                style={
                  selectedStatus === stat.status
                    ? {
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    : undefined
                }
              >
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={25} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {stat.value}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Student Directory */}
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-bold">Student Directory</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredStudents.length} student
                  {filteredStudents.length === 1 ? "" : "s"} displayed
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSelectedStatus(tab.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      selectedStatus === tab.value
                        ? "text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    style={
                      selectedStatus === tab.value
                        ? { backgroundColor: primaryColor }
                        : undefined
                    }
                  >
                    {tab.label} ({statusCounts[tab.value]})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-0 flex-1 sm:w-72">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search students..."
                    className={`${inputClass} pl-10 focus:ring-2`}
                    style={{
                      "--tw-ring-color": `${primaryColor}30`,
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={loadStudents}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Refresh students"
                  title="Refresh students"
                >
                  <RefreshCw
                    size={18}
                    className={loading ? "animate-spin" : ""}
                    style={{ color: primaryColor }}
                  />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw
                className="mx-auto animate-spin"
                style={{ color: primaryColor }}
                size={30}
              />
              <p className="mt-3 text-sm text-slate-500">
                Loading students...
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Users size={27} />
              </div>

              <h3 className="mt-4 font-bold">
                {search
                  ? "No matching students"
                  : `No ${selectedStatus === "all" ? "" : selectedStatus} students found`}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                {search
                  ? "Try a different name, admission number, or class."
                  : selectedStatus === "graduated"
                    ? "Graduated students will appear here after successful graduation."
                    : "There are no student records in this category."}
              </p>

              {!search && selectedStatus === "all" && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="mt-5 rounded-xl px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Register First Student
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Admission No.</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Graduation Session</th>
                    <th className="px-5 py-4">Gender</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold">
                          {student.first_name}{" "}
                          {student.middle_name
                            ? `${student.middle_name} `
                            : ""}
                          {student.last_name}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {student.admission_number}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {student.class_name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {student.status === "graduated"
                          ? graduationSession(student.id)
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {student.gender || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            student.status === "active"
                              ? "bg-green-50 text-green-700"
                              : student.status === "graduated"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {student.status !== "graduated" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditForm(student)}
                                title="Edit student"
                                className="rounded-lg p-2 hover:bg-slate-100"
                                style={{ color: primaryColor }}
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(student)}
                                title="Delete student"
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-purple-600">
                              Graduation completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Graduation Records */}
        {selectedStatus === "graduated" && (
          <section className="mt-7 rounded-2xl border border-purple-100 bg-purple-50 p-5">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-purple-600" size={25} />
              <div>
                <h2 className="font-bold text-purple-900">
                  Graduation Records
                </h2>
                <p className="mt-1 text-sm text-purple-700">
                  {graduationRecords.length} executed graduation decision
                  {graduationRecords.length === 1 ? "" : "s"} found.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Student Form Modal */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 py-6 sm:items-center sm:p-6">
            <div className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-extrabold">
                    {editingId ? "Edit Student" : "Register Student"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingId
                      ? "Update the student's information."
                      : "Enter the student's details and create their login."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close form"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Admission Number *
                    </label>
                    <input
                      required
                      name="admission_number"
                      value={form.admission_number}
                      onChange={handleChange}
                      placeholder="e.g. EDU/2026/001"
                      className={inputClass}
                    />
                  </div>

                  {!editingId && (
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <KeyRound
                          size={16}
                          style={{ color: primaryColor }}
                        />
                        Initial Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        required
                        className={inputClass}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Give the student this password securely.
                      </p>
                    </div>
                  )}

                  {/* Dynamic Class Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Class *
                    </label>

                    <select
                      required
                      name="class_name"
                      value={form.class_name}
                      onChange={handleChange}
                      disabled={classesLoading || !schoolType}
                      className={inputClass}
                    >
                      <option value="">
                        {classesLoading
                          ? "Loading classes..."
                          : "Select class"}
                      </option>

                      {(schoolType === "primary" ||
                        schoolType === "both") && (
                        <>
                          {nurseryClasses.length > 0 && (
                            <optgroup label="Nursery">
                              {nurseryClasses.map((item) => (
                                <option
                                  key={item.id}
                                  value={item.class_name}
                                >
                                  {item.class_name}
                                </option>
                              ))}
                            </optgroup>
                          )}

                          <optgroup label="Primary">
                            {primaryClasses.map((className) => (
                              <option key={className} value={className}>
                                {className}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}

                      {(schoolType === "secondary" ||
                        schoolType === "both") && (
                        <optgroup label="Secondary">
                          {secondaryClasses.map((className) => (
                            <option key={className} value={className}>
                              {className}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    {!classesLoading && !schoolType && (
                      <p className="mt-2 text-xs text-red-600">
                        Your school's type has not been configured.
                        Contact the platform administrator.
                      </p>
                    )}

                    {!classesLoading &&
                      (schoolType === "primary" ||
                        schoolType === "both") &&
                      nurseryClasses.length === 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          No Nursery classes have been configured yet.
                          Your school administrator can add them in Class
                          Configuration.
                        </p>
                      )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      First Name *
                    </label>
                    <input
                      required
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="First name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Last Name *
                    </label>
                    <input
                      required
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Last name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Middle Name
                    </label>
                    <input
                      name="middle_name"
                      value={form.middle_name}
                      onChange={handleChange}
                      placeholder="Middle name (optional)"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={form.date_of_birth}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Guardian's Phone
                    </label>
                    <input
                      type="tel"
                      name="guardian_phone"
                      value={form.guardian_phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Guardian's Name
                    </label>
                    <input
                      name="guardian_name"
                      value={form.guardian_name}
                      onChange={handleChange}
                      placeholder="Parent or guardian"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Address
                    </label>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Home address"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Student Status
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || classesLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {saving && (
                      <RefreshCw size={17} className="animate-spin" />
                    )}
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Student"
                        : "Create Student Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Student;
