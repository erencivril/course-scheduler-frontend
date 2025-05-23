// REFACTORED: Best-practice, admin-focused course selection and seat input for bulk scheduling

import React, { useState, useEffect } from "react";
import { colors } from "../theme/colors";
import { fetchCourses, fetchTerms, fetchCourseById } from "../services/auth";
import { postBulkSchedule } from "../services/bulkSchedule";
import { useNavigate, useLocation } from "react-router-dom";

interface Course {
  _id: string;
  courseCode: string;
  name: string;
  theoreticalSessions: number;
  laboratorySessions: number;
  description?: string;
  [key: string]: any;
}

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [seatCounts, setSeatCounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; course?: Course }>({ open: false });
  const navigate = useNavigate();
  const location = useLocation();
  // Expect termId to be passed via navigation state from Step 1
  const termId = (location.state && (location.state.termId || location.state.selectedTerm)) || "";

  useEffect(() => {
    setLoading(true);
    fetchCourses()
      .then((coursesData) => {
        setCourses(coursesData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load courses");
        setLoading(false);
      });
  }, []);

  // Filtered and sorted courses
  const displayCourses = React.useMemo(() => {
    let filtered = courses;
    if (search.trim()) {
      filtered = filtered.filter(
        (c) =>
          c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    // SE courses first, then others, both sorted
    const se = filtered.filter((c) => c.courseCode.startsWith("SE")).sort((a, b) => a.courseCode.localeCompare(b.courseCode));
    const other = filtered.filter((c) => !c.courseCode.startsWith("SE")).sort((a, b) => a.courseCode.localeCompare(b.courseCode));
    return [...se, ...other];
  }, [courses, search]);

  // Validation
  const canSubmit =
    Object.values(selected).some(Boolean) &&
    Object.entries(selected)
      .filter(([id, checked]) => checked)
      .every(([id]) => {
        const val = seatCounts[id];
        return val && !isNaN(Number(val)) && Number(val) > 0;
      });

  // Handlers
  const handleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
    if (!checked) {
      setSeatCounts((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const handleSeatCount = (id: string, value: string) => {
    setSeatCounts((prev) => ({ ...prev, [id]: value.replace(/\D/g, "") }));
    if (value && Number(value) > 0) setSelected((prev) => ({ ...prev, [id]: true }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const sections = displayCourses
        .filter((c) => selected[c._id])
        .map((c) => ({
          courseId: c._id,
          seatsAvailable: Number(seatCounts[c._id]),
        }));
      if (sections.length === 0) {
        setError("Select at least one course and enter seat counts.");
        setSubmitting(false);
        return;
      }
      if (!termId) {
        setError("Missing term ID. Please start from Step 1 (Excel upload).");
        setSubmitting(false);
        return;
      }
      const dto = {
        termId,
        sections,
      };
      const result = await postBulkSchedule(dto as any);
      setSuccess("Schedule generated successfully!");
      setTimeout(() => {
        navigate("/dashboard", { state: { scheduleData: result } });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to generate schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  // Details modal
  const openDetails = async (course: Course) => {
    setDetailsModal({ open: true, course });
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px 0 48px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <h2
        style={{
          fontSize: "32px",
          color: colors.orange,
          marginBottom: "32px",
          borderBottom: `2px solid ${colors.orange}`,
          paddingBottom: "14px",
          textAlign: "center",
          width: "100%",
        }}
      >
        Select Courses & Set Seat Counts
      </h2>
      <div style={{ marginBottom: 18, width: "100%", maxWidth: 420 }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "6px",
            border: `1px solid ${colors.border}`,
            fontSize: "15px",
          }}
        />
      </div>
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          background: colors.white,
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          marginBottom: "32px",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Select</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Course Code</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Name</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Seats</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: colors.orange }}>
                  Loading...
                </td>
              </tr>
            ) : displayCourses.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: colors.darkGray }}>
                  No courses found.
                </td>
              </tr>
            ) : (
              displayCourses.map((course) => (
                <tr key={course._id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={!!selected[course._id]}
                      onChange={(e) => handleSelect(course._id, e.target.checked)}
                    />
                  </td>
                  <td style={{ fontWeight: 600, color: colors.darkGray }}>{course.courseCode}</td>
                  <td style={{ color: colors.black }}>{course.name}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      value={seatCounts[course._id] || ""}
                      onChange={(e) => handleSeatCount(course._id, e.target.value)}
                      style={{
                        width: 80,
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: `1px solid ${colors.border}`,
                        fontSize: 15,
                      }}
                      disabled={!selected[course._id]}
                    />
                  </td>
                  <td>
                    <button
                      style={{
                        background: colors.orange,
                        color: colors.white,
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => openDetails(course)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Fixed footer submit */}
      <div
        style={{
          position: "fixed",
          left: 0,
          bottom: 0,
          width: "100vw",
          background: colors.white,
          borderTop: `2px solid ${colors.orange}`,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
          padding: "18px 0",
          display: "flex",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{
            background: canSubmit ? colors.orange : colors.lightGray,
            color: canSubmit ? colors.white : colors.darkGray,
            border: "none",
            borderRadius: "6px",
            padding: "14px 48px",
            fontWeight: 700,
            fontSize: "18px",
            cursor: canSubmit ? "pointer" : "not-allowed",
            boxShadow: canSubmit ? "0 2px 8px rgba(232,119,34,0.12)" : "none",
            opacity: submitting ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {submitting ? "Submitting..." : "Submit Availability"}
        </button>
      </div>
      {/* Error/Success */}
      {error && (
        <div
          style={{
            position: "fixed",
            left: 0,
            bottom: 70,
            width: "100vw",
            textAlign: "center",
            color: colors.error,
            fontWeight: 700,
            fontSize: "16px",
            zIndex: 101,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            position: "fixed",
            left: 0,
            bottom: 70,
            width: "100vw",
            textAlign: "center",
            color: colors.success,
            fontWeight: 700,
            fontSize: "16px",
            zIndex: 101,
          }}
        >
          {success}
        </div>
      )}
      {/* Details Modal */}
      {detailsModal.open && detailsModal.course && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setDetailsModal({ open: false })}
        >
          <div
            style={{
              background: colors.white,
              borderRadius: "14px",
              padding: "32px 28px",
              minWidth: "320px",
              maxWidth: "400px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ color: colors.orange, marginTop: 0 }}>{detailsModal.course.courseCode}</h4>
            <div style={{ fontWeight: 600, fontSize: "18px", marginBottom: "10px" }}>{detailsModal.course.name}</div>
            <div>
              Theory: {detailsModal.course.theoreticalSessions} | Lab: {detailsModal.course.laboratorySessions}
            </div>
            {detailsModal.course.description && (
              <div style={{ margin: "10px 0" }}>
                <strong>Description:</strong> {detailsModal.course.description}
              </div>
            )}
            {Object.entries(detailsModal.course).map(([key, value]) =>
              ["courseCode", "name", "theoreticalSessions", "laboratorySessions", "description", "_id"].includes(key) ? null : (
                <div key={key}>
                  <strong>{key}:</strong> {String(value)}
                </div>
              )
            )}
            <button
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: colors.error,
                color: colors.white,
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontWeight: 700,
                fontSize: "18px",
                cursor: "pointer",
              }}
              onClick={() => setDetailsModal({ open: false })}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
