
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  RefreshCw,
  BookOpen,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/superbase";

const ClassConfiguration = () => {
  const { profile } = useAuth();

  const schoolId = profile?.school_id;

  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchClasses = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("school_classes")
      .select("*")
      .eq("school_id", schoolId)
      .eq("section", "nursery")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      setClasses([]);
    } else {
      setClasses(data || []);
    }

    setLoading(false);
  }, [schoolId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const resetForm = () => {
    setClassName("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = className.trim();

    if (!trimmedName) {
      setError("Please enter a Nursery class name.");
      return;
    }

    if (!schoolId) {
      setError("Your school account could not be identified.");
      return;
    }

    const duplicate = classes.some(
      (item) =>
        item.class_name.toLowerCase() === trimmedName.toLowerCase() &&
        item.id !== editingId
    );

    if (duplicate) {
      setError("This class already exists.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    if (editingId) {
      const { error } = await supabase
        .from("school_classes")
        .update({ class_name: trimmedName })
        .eq("id", editingId)
        .eq("school_id", schoolId);

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Nursery class updated successfully.");
        resetForm();
        await fetchClasses();
      }
    } else {
      const { error } = await supabase
        .from("school_classes")
        .insert({
          school_id: schoolId,
          class_name: trimmedName,
          section: "nursery",
          is_active: true,
        });

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Nursery class added successfully.");
        resetForm();
        await fetchClasses();
      }
    }

    setSaving(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setClassName(item.class_name);
    setError("");
    setSuccess("");
  };

  const handleToggleStatus = async (item) => {
    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("school_classes")
      .update({ is_active: !item.is_active })
      .eq("id", item.id)
      .eq("school_id", schoolId);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(
        item.is_active
          ? "Class deactivated successfully."
          : "Class activated successfully."
      );
      await fetchClasses();
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${item.class_name}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("school_classes")
      .delete()
      .eq("id", item.id)
      .eq("school_id", schoolId);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Nursery class deleted successfully.");

      if (editingId === item.id) {
        resetForm();
      }

      await fetchClasses();
    }
  };

  const activeClasses = classes.filter((item) => item.is_active);
  const inactiveClasses = classes.filter((item) => !item.is_active);

  if (!schoolId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Your school account could not be identified. Please sign in again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <BookOpen size={16} />
            Academic Management
            <span>/</span>
            Nursery
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Nursery Class Configuration
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage the Nursery classes available in your school.
          </p>
        </div>

        <button
          onClick={fetchClasses}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Information */}
      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <BookOpen className="mt-0.5 shrink-0 text-blue-600" size={20} />

        <div>
          <h3 className="font-semibold text-blue-900">
            School-configured classes
          </h3>
          <p className="mt-1 text-sm text-blue-800">
            Your school can create its own Nursery classes, such as Playgroup,
            Nursery 1, Nursery 2 and Nursery 3. Only active classes will appear
            when registering students.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <Check size={18} />
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Classes</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {classes.length}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Active Classes</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {activeClasses.length}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Inactive Classes</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-500">
            {inactiveClasses.length}
          </h2>
        </div>
      </div>

      {/* Add / Edit class */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">
              {editingId ? "Edit Nursery Class" : "Add Nursery Class"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {editingId
                ? "Update the name of this class."
                : "Enter the name of a new Nursery class."}
            </p>
          </div>

          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              title="Cancel editing"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. Playgroup, Nursery 1"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={saving || !className.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}

            {saving
              ? "Saving..."
              : editingId
                ? "Update Class"
                : "Add Class"}
          </button>
        </form>
      </div>

      {/* Class list */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="font-bold text-gray-900">Your Nursery Classes</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage the classes configured for your school.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading Nursery classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="mx-auto mb-3 text-gray-300" size={40} />
            <h3 className="font-semibold text-gray-800">
              No Nursery classes yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your first Nursery class using the form above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {classes.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <BookOpen size={20} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.class_name}
                    </h3>

                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Power size={15} />
                    {item.is_active ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    onClick={() => handleDelete(item)}
                    className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassConfiguration;
