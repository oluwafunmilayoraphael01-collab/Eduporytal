
import { useEffect, useState } from "react";
import {
  Palette,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/superbase";
import { useAuth } from "../context/AuthContext";

function SchoolAppearance({ school, onBrandingSaved }) {
  const { profile } = useAuth();

  const schoolId =
    profile?.school_id || school?.school_id || school?.id;

  const [schoolName, setSchoolName] = useState("");
  const [logo, setLogo] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState("#0f172a");
  const [accentColor, setAccentColor] = useState("#f59e0b");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // Load saved school branding
  useEffect(() => {
    async function loadBranding() {
      if (!schoolId) {
        setMessage({
          type: "error",
          text: "Your account is not assigned to a school.",
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("schools")
          .select(
            "id, name, logo_url, primary_color, secondary_color, accent_color"
          )
          .eq("id", schoolId)
          .single();

        if (error) throw error;

        setSchoolName(data.name || "");
        setLogoUrl(data.logo_url || "");
        setPrimaryColor(data.primary_color || "#2563eb");
        setSecondaryColor(data.secondary_color || "#0f172a");
        setAccentColor(data.accent_color || "#f59e0b");
      } catch (error) {
        console.error("Branding loading error:", error);

        setMessage({
          type: "error",
          text: error.message || "Unable to load school branding.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadBranding();
  }, [schoolId]);

  // Generate temporary logo preview
  useEffect(() => {
    if (!logo) {
      setLogoPreview("");
      return;
    }

    const preview = URL.createObjectURL(logo);
    setLogoPreview(preview);

    return () => URL.revokeObjectURL(preview);
  }, [logo]);

  // Select logo
  function handleLogoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Please select a PNG, JPG or WEBP image.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Logo must not exceed 2MB.",
      });
      event.target.value = "";
      return;
    }

    setLogo(file);
    setMessage({ type: "", text: "" });
  }

  // Reset colours
  function resetColors() {
    setPrimaryColor("#2563eb");
    setSecondaryColor("#0f172a");
    setAccentColor("#f59e0b");
    setMessage({ type: "", text: "" });
  }

  // Save branding to Supabase
  async function handleSave() {
    if (!schoolId) {
      setMessage({
        type: "error",
        text: "School information is missing.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      let finalLogoUrl = logoUrl;

      // Upload selected logo
      if (logo) {
        const filePath = `${schoolId}/logo`;

        const { error: uploadError } = await supabase.storage
          .from("school-logos")
          .upload(filePath, logo, {
            upsert: true,
            contentType: logo.type,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("school-logos")
          .getPublicUrl(filePath);

        finalLogoUrl = data.publicUrl;
      }

      // Update school record
      const { error: updateError } = await supabase
        .from("schools")
        .update({
          logo_url: finalLogoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
        })
        .eq("id", schoolId);

      if (updateError) throw updateError;

      setLogoUrl(finalLogoUrl);
      setLogo(null);

      // Notify SchoolDashboard immediately
      onBrandingSaved?.({
        logo_url: finalLogoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
      });

      setMessage({
        type: "success",
        text: "School branding saved successfully!",
      });
    } catch (error) {
      console.error("Branding save error:", error);

      setMessage({
        type: "error",
        text: error.message || "Unable to save school branding.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={30} />
        <span className="ml-3 text-sm text-slate-500">
          Loading school appearance...
        </span>
      </div>
    );
  }

  const currentLogo = logoPreview || logoUrl;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">
          School Administration / Settings
        </p>

        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          School Appearance
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Personalize your school's portal with its logo and brand colours.
        </p>
      </div>

      {/* Feedback */}
      {message.text && (
        <div
          role="alert"
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={19} />
          ) : (
            <AlertCircle size={19} />
          )}

          {message.text}
        </div>
      )}

      {/* School logo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <ImageIcon size={23} />
          </div>

          <div>
            <h2 className="font-bold">School Logo</h2>
            <p className="text-sm text-slate-500">
              Upload your official school logo.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-5 rounded-xl border-2 border-dashed border-slate-200 p-8 sm:flex-row">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="School logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <ImageIcon size={35} className="text-slate-300" />
            )}
          </div>

          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              <Upload size={17} />
              Upload Logo

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>

            <p className="mt-3 text-xs text-slate-500">
              PNG, JPG or WEBP. Maximum size: 2MB.
            </p>

            {logo && (
              <p className="mt-2 text-xs font-medium text-green-600">
                {logo.name} selected
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Brand colours */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Palette size={23} />
            </div>

            <div>
              <h2 className="font-bold">Brand Colours</h2>
              <p className="text-sm text-slate-500">
                Choose your school's colours.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetColors}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <RotateCcw size={15} />
            Reset colours
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            {
              label: "Primary Colour",
              value: primaryColor,
              setter: setPrimaryColor,
            },
            {
              label: "Secondary Colour",
              value: secondaryColor,
              setter: setSecondaryColor,
            },
            {
              label: "Accent Colour",
              value: accentColor,
              setter: setAccentColor,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 p-4"
            >
              <label className="text-sm font-semibold">
                {item.label}
              </label>

              <div className="mt-3 flex items-center gap-3">
                <input
                  type="color"
                  value={item.value}
                  onChange={(e) => item.setter(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-lg border-0"
                />

                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                      item.setter(value);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live preview */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 p-6">
          <Eye size={21} className="text-blue-600" />

          <div>
            <h2 className="font-bold">Live Portal Preview</h2>
            <p className="text-sm text-slate-500">
              See how your school portal will look.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div
              className="flex items-center gap-3 p-4 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white">
                {currentLogo ? (
                  <img
                    src={currentLogo}
                    alt="School logo preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon color={primaryColor} />
                )}
              </div>

              <span className="font-bold">
                {schoolName || "Your School Name"}
              </span>
            </div>

            <div className="flex min-h-56">
              <div
                className="hidden w-40 p-4 text-white sm:block"
                style={{ backgroundColor: secondaryColor }}
              >
                <p className="mb-5 text-xs font-bold">SCHOOL PORTAL</p>
                <p className="mb-4 text-sm">Dashboard</p>
                <p className="mb-4 text-sm opacity-70">Students</p>
                <p className="text-sm opacity-70">Teachers</p>
              </div>

              <div className="flex-1 bg-slate-50 p-5">
                <h3 className="font-bold text-slate-800">
                  Welcome to your portal
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  Your school dashboard preview.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">Students</p>
                    <p className="mt-2 text-xl font-bold">250</p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">Teachers</p>
                    <p className="mt-2 text-xl font-bold">18</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}

          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default SchoolAppearance;
