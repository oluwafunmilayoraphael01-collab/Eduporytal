import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  RefreshCw,
  Search,
  Clock,
  ArrowUpRight,
  ArrowLeftRight,
  X,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/superbase";

function StudentPromotion() {
  const { profile } = useAuth();

  const [academicSession, setAcademicSession] = useState("2026/2027");
  const [selectedClass, setSelectedClass] = useState("JSS 1");
  const [activeTab, setActiveTab] = useState("All Students");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [students, setStudents] = useState([]);
  const [studentAverages, setStudentAverages] = useState({});
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resultsError, setResultsError] = useState("");

  const [pendingDecision, setPendingDecision] = useState(null);
  const [pendingReversal, setPendingReversal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const classes = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];
  const terms = ["First Term", "Second Term", "Third Term"];

  // Determine the next class
  const getNextClass = (currentClass) => {
    const progression = {
      "JSS 1": "JSS 2",
      "JSS 2": "JSS 3",
      "JSS 3": "SSS 1",
      "SSS 1": "SSS 2",
      "SSS 2": "SSS 3",
      "SSS 3": "Graduated",
    };

    return progression[currentClass] || "Unknown";
  };

  // Get student's full name
  const getStudentName = (student) =>
    [student?.first_name, student?.middle_name, student?.last_name]
      .filter(Boolean)
      .join(" ");

  // Load students, results and promotion history
  const loadStudents = useCallback(async () => {
    if (!profile?.school_id) {
      setError("Your account is not assigned to a school.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setResultsError("");
    setStudentAverages({});

    try {
      // 1. Fetch students belonging to this school
      const { data: studentData, error: studentsError } = await supabase
        .from("students")
        .select(
          "id, school_id, first_name, middle_name, last_name, admission_number, class_name, status"
        )
        .eq("school_id", profile.school_id)
        .order("first_name", { ascending: true });

      if (studentsError) throw studentsError;

      const studentList = studentData || [];
      setStudents(studentList);

      // 2. Fetch executed AND reversed decisions for this session
      const { data: decisionData, error: decisionsError } = await supabase
        .from("student_promotion_decisions")
        .select(
          "id, student_id, academic_session, from_class, to_class, decision, decision_status, created_at"
        )
        .eq("school_id", profile.school_id)
        .eq("academic_session", academicSession)
        .in("decision_status", ["executed", "reversed"])
        .order("created_at", { ascending: false });

      if (decisionsError) throw decisionsError;

      const studentById = Object.fromEntries(
        studentList.map((student) => [student.id, student])
      );

      setDecisions(
        (decisionData || [])
          .map((decision) => ({
            ...decision,
            student: studentById[decision.student_id] || null,
          }))
          .filter((decision) => decision.student)
      );

      // 3. Fetch published results for active students
      const activeStudentList = studentList.filter(
        (student) => (student.status || "active").toLowerCase() === "active"
      );

      if (activeStudentList.length === 0) {
        setStudentAverages({});
        return;
      }

      const studentIds = activeStudentList.map((student) => student.id);

      const { data: results, error: resultsQueryError } = await supabase
        .from("student_results")
        .select("student_id, subject_name, term, total_score")
        .eq("school_id", profile.school_id)
        .eq("academic_session", academicSession)
        .eq("is_published", true)
        .in("term", terms)
        .in("student_id", studentIds);

      if (resultsQueryError) {
        setResultsError(resultsQueryError.message);
        return;
      }

      // 4. Group results by student
      const groupedResults = {};

      (results || []).forEach((result) => {
        if (!groupedResults[result.student_id]) {
          groupedResults[result.student_id] = {
            totalScore: 0,
            resultCount: 0,
            termsCovered: [],
          };
        }

        const score = Number(result.total_score);

        if (Number.isFinite(score)) {
          groupedResults[result.student_id].totalScore += score;
          groupedResults[result.student_id].resultCount += 1;
        }

        if (
          result.term &&
          !groupedResults[result.student_id].termsCovered.includes(
            result.term
          )
        ) {
          groupedResults[result.student_id].termsCovered.push(result.term);
        }
      });

      // 5. Calculate overall average
      const averages = {};

      Object.entries(groupedResults).forEach(([studentId, result]) => {
        averages[studentId] = {
          average:
            result.resultCount > 0
              ? result.totalScore / result.resultCount
              : null,
          termsCovered: result.termsCovered.length,
          resultCount: result.resultCount,
        };
      });

      setStudentAverages(averages);
    } catch (err) {
      console.error("Student promotion loading error:", err);
      setError(err.message || "Unable to load student records.");
    } finally {
      setLoading(false);
    }
  }, [profile?.school_id, academicSession]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Only active students can be processed
  const activeStudents = useMemo(
    () =>
      students.filter(
        (student) => (student.status || "active").toLowerCase() === "active"
      ),
    [students]
  );

  // Filter promotion, repetition and reversal history
  const historyDecisions = useMemo(() => {
    if (activeTab === "Promoted") {
      return decisions.filter(
        (item) =>
          item.decision_status === "executed" &&
          ["promoted", "graduated"].includes(item.decision)
      );
    }

    if (activeTab === "Repeated") {
      return decisions.filter(
        (item) =>
          item.decision_status === "executed" &&
          item.decision === "repeated"
      );
    }

    if (activeTab === "Reversed") {
      return decisions.filter(
        (item) => item.decision_status === "reversed"
      );
    }

    return [];
  }, [decisions, activeTab]);

  // Filter records according to the selected tab
  const filteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (activeTab !== "All Students") {
      return historyDecisions.filter((item) => {
        const student = item.student;
        const name = getStudentName(student).toLowerCase();

        return (
          name.includes(search) ||
          (student.admission_number || "").toLowerCase().includes(search)
        );
      });
    }

    return activeStudents.filter((student) => {
      const matchesClass =
        student.class_name?.trim().replace(/\s+/g, "").toUpperCase() ===
        selectedClass.trim().replace(/\s+/g, "").toUpperCase();

      const matchesSearch =
        getStudentName(student).toLowerCase().includes(search) ||
        (student.admission_number || "").toLowerCase().includes(search);

      return matchesClass && matchesSearch;
    });
  }, [
    activeTab,
    activeStudents,
    historyDecisions,
    searchTerm,
    selectedClass,
  ]);

  // Select or deselect one student
  const toggleStudent = (id) => {
    setSelectedStudents((previous) =>
      previous.includes(id)
        ? previous.filter((studentId) => studentId !== id)
        : [...previous, id]
    );
  };

  // Select or deselect all visible students
  const toggleAllStudents = () => {
    const visibleIds = filteredStudents.map((student) => student.id);

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedStudents.includes(id));

    if (allSelected) {
      setSelectedStudents((previous) =>
        previous.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedStudents((previous) => [
        ...new Set([...previous, ...visibleIds]),
      ]);
    }
  };

  // Open promotion or repetition confirmation modal
  const handleDecision = (decision) => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    setActionError("");
    setSuccessMessage("");
    setPendingDecision(decision);
  };

  // Close modal
  const closeModal = () => {
    if (processing) return;

    setPendingDecision(null);
    setPendingReversal(null);
    setActionError("");
  };

  // Confirm promotion or repetition
  const confirmDecision = async () => {
    if (!pendingDecision || selectedStudents.length === 0) return;

    setProcessing(true);
    setActionError("");

    try {
      const { data, error: decisionError } = await supabase.rpc(
        "process_student_promotion",
        {
          p_student_ids: selectedStudents,
          p_academic_session: academicSession,
          p_decision: pendingDecision,
        }
      );

      if (decisionError) throw decisionError;

      setSuccessMessage(
        `Successfully processed ${data.processed} student(s). ` +
          `Promoted: ${data.promoted}, Repeated: ${data.repeated}, ` +
          `Graduated: ${data.graduated}.`
      );

      setSelectedStudents([]);
      setPendingDecision(null);

      await loadStudents();
    } catch (err) {
      console.error("Promotion decision error:", err);
      setActionError(err.message || "Unable to save the promotion decision.");
    } finally {
      setProcessing(false);
    }
  };

  // Reverse an incorrect promotion or graduation
  const confirmReversal = async () => {
    if (!pendingReversal?.id) return;

    setProcessing(true);
    setActionError("");

    try {
      const { error: reversalError } = await supabase.rpc(
        "reverse_student_promotion",
        {
          p_decision_id: pendingReversal.id,
        }
      );

      if (reversalError) throw reversalError;

      setSuccessMessage(
        `${getStudentName(pendingReversal.student)} was restored to ${
          pendingReversal.from_class
        } and recorded as repeated.`
      );

      setPendingReversal(null);

      await loadStudents();
    } catch (err) {
      console.error("Promotion reversal error:", err);
      setActionError(
        err.message || "Unable to reverse this promotion decision."
      );
    } finally {
      setProcessing(false);
    }
  };

  // Get selected student records
  const selectedStudentRecords = students.filter((student) =>
    selectedStudents.includes(student.id)
  );

  const decisionLabel =
    pendingDecision === "promoted" ? "Promotion" : "Repetition";

  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) => selectedStudents.includes(student.id));

  // History counts
  const promotedCount = decisions.filter(
    (item) =>
      item.decision_status === "executed" &&
      ["promoted", "graduated"].includes(item.decision)
  ).length;

  const repeatedCount = decisions.filter(
    (item) =>
      item.decision_status === "executed" &&
      item.decision === "repeated"
  ).length;

  const reversedCount = decisions.filter(
    (item) => item.decision_status === "reversed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Student Promotion
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage student promotion and repetition for a new academic session.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">Action completed successfully</p>
            <p className="mt-1 text-sm">{successMessage}</p>
          </div>

          <button onClick={() => setSuccessMessage("")} aria-label="Dismiss">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Users size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Active Students</p>
              <h2 className="text-2xl font-bold">{activeStudents.length}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <GraduationCap size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Selected</p>
              <h2 className="text-2xl font-bold">
                {selectedStudents.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
              <RefreshCw size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Current Class</p>
              <h2 className="text-2xl font-bold">{selectedClass}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Promotion settings */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Promotion Settings</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Academic Session
            </label>

            <select
              value={academicSession}
              onChange={(e) => {
                setAcademicSession(e.target.value);
                setSelectedStudents([]);
              }}
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Select Class
            </label>

            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStudents([]);
              }}
              disabled={activeTab !== "All Students"}
              className="w-full rounded-lg border px-4 py-3 disabled:bg-slate-100"
            >
              {classes.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student records */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">Student Records</h2>

            <p className="mt-1 text-sm text-slate-500">
              View current students and decisions saved for this academic
              session.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-3 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 sm:w-64"
              />
            </div>

            <button
              onClick={loadStudents}
              disabled={loading}
              className="rounded-lg border px-3 hover:bg-slate-50"
              title="Refresh students"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 overflow-x-auto border-b px-5">
          {["All Students", "Promoted", "Repeated", "Reversed"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedStudents([]);
                setSearchTerm("");
                setActionError("");
              }}
              className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500"
              }`}
            >
              {tab}

              {tab === "Promoted" && (
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  {promotedCount}
                </span>
              )}

              {tab === "Repeated" && (
                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                  {repeatedCount}
                </span>
              )}

              {tab === "Reversed" && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  {reversedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {activeTab === "All Students" && (
          <div className="flex flex-col gap-3 border-b bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {selectedStudents.length} student(s) selected
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDecision("promoted")}
                disabled={loading || processing}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <ArrowUpRight size={17} />
                Promote Selected
              </button>

              <button
                onClick={() => handleDecision("repeated")}
                disabled={loading || processing}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <RefreshCw size={17} />
                Repeat Selected
              </button>
            </div>
          </div>
        )}

        {resultsError && activeTab === "All Students" && (
          <div className="border-b bg-amber-50 px-5 py-3 text-sm text-amber-800">
            Results could not be loaded: {resultsError}
          </div>
        )}

        {/* Records table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              {activeTab === "All Students" ? (
                <tr>
                  <th className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllStudents}
                      aria-label="Select all visible students"
                    />
                  </th>

                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Admission No.</th>
                  <th className="px-5 py-4">Current Class</th>
                  <th className="px-5 py-4">Overall Average</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Admission No.</th>
                  <th className="px-5 py-4">Previous Class</th>
                  <th className="px-5 py-4">Decision</th>
                  <th className="px-5 py-4">New Class / Status</th>

                  {activeTab === "Promoted" && (
                    <th className="px-5 py-4">Correction</th>
                  )}
                </tr>
              )}
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <RefreshCw
                      className="mx-auto animate-spin text-blue-600"
                      size={25}
                    />

                    <p className="mt-3 text-slate-500">Loading records...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                activeTab === "All Students" ? (
                  filteredStudents.map((student) => {
                    const result = studentAverages[student.id];

                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            aria-label={`Select ${getStudentName(student)}`}
                          />
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {getStudentName(student)}
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {student.admission_number || "—"}
                        </td>

                        <td className="px-5 py-4">{student.class_name}</td>

                        <td className="px-5 py-4">
                          {resultsError ? (
                            <span className="text-slate-400">
                              Unavailable
                            </span>
                          ) : result?.resultCount > 0 ? (
                            <div>
                              <span className="font-semibold text-slate-800">
                                {result.average.toFixed(2)}%
                              </span>

                              <p className="mt-1 text-xs text-slate-500">
                                {result.termsCovered === 3
                                  ? "All 3 terms"
                                  : `${result.termsCovered}/3 terms recorded`}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">No results</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                            {student.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  filteredStudents.map((item) => {
                    const student = item.student;
                    const isGraduated = item.decision === "graduated";
                    const isReversed = item.decision_status === "reversed";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium">
                          {getStudentName(student)}
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {student.admission_number || "—"}
                        </td>

                        <td className="px-5 py-4">{item.from_class}</td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              isReversed
                                ? "bg-red-100 text-red-700"
                                : item.decision === "repeated"
                                  ? "bg-orange-100 text-orange-700"
                                  : isGraduated
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isReversed
                              ? "Reversed"
                              : isGraduated
                                ? "Graduated"
                                : item.decision === "repeated"
                                  ? "Repeated"
                                  : "Promoted"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {isReversed
                            ? "Original decision reversed"
                            : isGraduated
                              ? "Graduated (SSS 3)"
                              : item.to_class || item.from_class}
                        </td>

                        {activeTab === "Promoted" && (
                          <td className="px-5 py-4">
                            {item.decision_status === "executed" &&
                              ["promoted", "graduated"].includes(
                                item.decision
                              ) && (
                                <button
                                  onClick={() => {
                                    setActionError("");
                                    setPendingReversal(item);
                                  }}
                                  disabled={processing}
                                  className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                                >
                                  <RotateCcw size={14} />
                                  Repeat Instead
                                </button>
                              )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    {activeTab === "All Students"
                      ? `No active students found in ${selectedClass}.`
                      : `No ${activeTab.toLowerCase()} decisions found for ${academicSession}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 border-t p-4 text-xs text-slate-500">
          <Clock size={15} />
          Average is calculated from published subject results. Review
          incomplete terms before making promotion decisions.
        </div>
      </div>

      {/* Promotion / repetition confirmation modal */}
      {pendingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Confirm {decisionLabel}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Academic session: {academicSession}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={processing}
                className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[55vh] space-y-4 overflow-y-auto p-5">
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-amber-800">
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />

                <p className="text-sm">
                  Review these students carefully. Confirming will update their
                  school records.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">
                  Selected Students
                </h3>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {selectedStudentRecords.length} selected
                </span>
              </div>

              <div className="divide-y rounded-lg border">
                {selectedStudentRecords.map((student) => {
                  const nextClass =
                    pendingDecision === "repeated"
                      ? student.class_name
                      : getNextClass(student.class_name);

                  const isGraduating =
                    pendingDecision === "promoted" &&
                    student.class_name === "SSS 3";

                  return (
                    <div
                      key={student.id}
                      className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {getStudentName(student)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {student.admission_number}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="rounded-md bg-slate-100 px-3 py-1 text-slate-600">
                          {student.class_name}
                        </span>

                        <ArrowUpRight size={16} className="text-slate-400" />

                        <span
                          className={`rounded-md px-3 py-1 font-medium ${
                            isGraduating
                              ? "bg-purple-100 text-purple-700"
                              : pendingDecision === "repeated"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {nextClass}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {actionError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t bg-slate-50 p-5 sm:flex-row">
              <button
                onClick={closeModal}
                disabled={processing}
                className="rounded-lg border bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmDecision}
                disabled={processing || selectedStudentRecords.length === 0}
                className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
                  pendingDecision === "promoted"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {processing ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Decision"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repeat Instead correction modal */}
      {pendingReversal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Confirm Correction
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  This will reverse the previous decision.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={processing}
                className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close correction modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-amber-800">
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />

                <p className="text-sm">
                  The original decision will be preserved as reversed. The
                  student will be restored to the previous class and recorded
                  as repeated for this academic session.
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="font-semibold text-slate-800">
                  {getStudentName(pendingReversal.student)}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Admission No:{" "}
                  {pendingReversal.student.admission_number || "—"}
                </p>

                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="rounded-md bg-slate-100 px-3 py-2">
                    {pendingReversal.decision === "graduated"
                      ? "Graduated (SSS 3)"
                      : pendingReversal.to_class}
                  </span>

                  <ArrowLeftRight size={17} className="text-slate-400" />

                  <span className="rounded-md bg-orange-100 px-3 py-2 font-medium text-orange-700">
                    {pendingReversal.from_class} (Repeated)
                  </span>
                </div>
              </div>

              {actionError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t bg-slate-50 p-5 sm:flex-row">
              <button
                onClick={closeModal}
                disabled={processing}
                className="rounded-lg border bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmReversal}
                disabled={processing}
                className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-red hover:bg-orange-700 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Correcting...
                  </>
                ) : (
                  <>
                    <RotateCcw size={17} />
                     Confirm Repeat Instead
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentPromotion;