// REFACTORED: Best-practice, admin-focused course selection and seat input for bulk scheduling

import React, { useState, useEffect } from "react";
import { colors } from "../theme/colors";
import { fetchCourses } from "../services/auth";

interface Course {
  _id: string;
  courseCode: string;
  name: string;
  theoreticalSessions: number;
  laboratorySessions: number;
  description?: string;
  yearLevel?: number;
  department?: string;
  prerequisites?: string[];
  [key: string]: any;
}

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; course?: Course }>({ open: false });

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

  // Details modal
  const openDetails = (course: Course) => {
    setDetailsModal({ open: true, course });
  };
  const closeDetails = () => setDetailsModal({ open: false });

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
        University Courses
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
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Course Code</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Name</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Year</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Theoretical</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Lab</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Description</th>
              <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700 }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: colors.orange }}>
                  Loading...
                </td>
              </tr>
            ) : displayCourses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: colors.darkGray }}>
                  No courses found.
                </td>
              </tr>
            ) : (
              displayCourses.map((course) => (
                <tr key={course._id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ fontWeight: 600, color: colors.darkGray, padding: "8px" }}>{course.courseCode}</td>
                  <td style={{ color: colors.black, padding: "8px" }}>{course.name}</td>
                  <td style={{ color: colors.black, padding: "8px" }}>{course.yearLevel ?? "-"}</td>
                  <td style={{ color: colors.black, padding: "8px" }}>{course.theoreticalSessions}</td>
                  <td style={{ color: colors.black, padding: "8px" }}>{course.laboratorySessions}</td>
                  <td style={{ color: colors.black, padding: "8px", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{course.description ?? "-"}</td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <button
                      onClick={() => openDetails(course)}
                      style={{
                        background: colors.orange,
                        color: colors.white,
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 16px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
          onClick={closeDetails}
        >
          <div
            style={{
              background: colors.white,
              borderRadius: 12,
              boxShadow: "0 2px 12px #0002",
              padding: 32,
              minWidth: 340,
              maxWidth: 480,
              width: "90%",
              position: "relative",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeDetails}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "#eee",
                border: "none",
                borderRadius: 6,
                padding: "4px 10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <h3 style={{ color: colors.orange, marginBottom: 18 }}>{detailsModal.course.name} ({detailsModal.course.courseCode})</h3>
            <div style={{ marginBottom: 8 }}><b>Year:</b> {detailsModal.course.yearLevel ?? "-"}</div>
            <div style={{ marginBottom: 8 }}><b>Theoretical Sessions:</b> {detailsModal.course.theoreticalSessions}</div>
            <div style={{ marginBottom: 8 }}><b>Laboratory Sessions:</b> {detailsModal.course.laboratorySessions}</div>
            <div style={{ marginBottom: 8 }}><b>Description:</b> {detailsModal.course.description ?? "-"}</div>
            {detailsModal.course.prerequisites && detailsModal.course.prerequisites.length > 0 && (
              <div style={{ marginBottom: 8 }}><b>Prerequisites:</b> {detailsModal.course.prerequisites.join(", ")}</div>
            )}
            {/* Show all other fields if needed */}
            {Object.entries(detailsModal.course).map(([key, value]) => {
              if ([
                "_id", "courseCode", "name", "yearLevel", "department", "theoreticalSessions", "laboratorySessions", "description", "prerequisites",
                "maxStudentsPerSection", "isCommon", "isActive", "createdAt", "updatedAt", "__v"
              ].includes(key)) return null;
              return (
                <div key={key} style={{ marginBottom: 8 }}><b>{key}:</b> {String(value)}</div>
              );
            })}
          </div>
        </div>
      )}
      {error && <div style={{ color: colors.error, marginTop: 10 }}>{error}</div>}
    </div>
  );
};

export default CoursesPage;
