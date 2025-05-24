import React, { useState, useEffect, useMemo } from "react";
import { colors } from "../theme/colors";
// fetchSectionsByTerm exists, fetchAllUsers and fetchAllClassrooms do not yet.
import { fetchTerms, fetchCourses, fetchSectionsByTerm, fetchSectionById, fetchSectionsByTermAndYearLevel, fetchAllSections, deleteSectionById } from "../services/auth"; 
// Placeholder for future services:
// import { fetchAllUsers, fetchAllClassrooms } from "../services/data"; // (if moved to a new file)
import { postBulkSchedule, postLoadSections } from "../services/bulkSchedule";
import type { BulkSectionDto } from "../types/BulkSectionDto";
import CalendarStep from "./CalendarStep"; // Import CalendarStep
import { createTerm, deleteTerm } from "../services/auth";
import type { Term } from "../types/Term";

// Placeholder types (would ideally be more robust and possibly shared)
// These should match the actual data structures from backend or be adapted
interface FullSectionDetailSession {
  _id: string; // sessionId
  lessonType: 'Lecture' | 'Lab';
  days: string[];
  timeSlots: { start: string; end: string }[];
  classroom: string; // Classroom ObjectId
}

interface FullSectionDetail {
  _id: string; // sectionId
  term: string; 
  course: { // Corrected: course is an object
    _id: string;
    courseCode?: string;
    name?: string;
    yearLevel?: number; // Assuming yearLevel might be here
    year?: number;      // Or here
    [key: string]: any; // Allow other properties
  };
  sectionNumber: number;
  sessions: FullSectionDetailSession[];
  maxCapacity: number;
  assignedLecturers: string[]; 
  assignedAssistants: string[];
  yearLevel?: number; // For year filtering
}

interface User {
  _id: string;
  name: string;
  // other user fields
}

interface Classroom {
  _id: string;
  name: string; 
}

// For CalendarStep's sectionMap prop
interface SectionMapEntry {
  _id: string;
  course: { courseCode: string; name: string };
  sectionNumber: number;
  lecturers?: string; 
  detailedSessions?: Array<{
    sessionId: string;
    lessonType: 'Lecture' | 'Lab';
    days: string[];
    timeSlots: { start: string; end: string }[];
    classroomName?: string;
  }>;
  yearLevel?: number;
}
interface SectionMap {
  [sectionId: string]: SectionMapEntry;
}

// For CalendarStep's scheduleData prop (matches backend ScheduleResultDto)
interface BackendAssignedSessionDto {
  sessionId: string;
  day: string;
  start: string;
  end: string;
}
interface BackendScheduleAssignmentDto {
  sectionId: string;
  assignedSessions: BackendAssignedSessionDto[];
}
interface BackendScheduleResultDto {
  schedule: BackendScheduleAssignmentDto[];
  conflicts: any[]; 
}

// Add a new TermManagementStep component
const TermManagementStep: React.FC<{
  terms: Term[];
  selectedTermId: string | null;
  onSelect: (id: string) => void;
  onCreate: (term: { name: string; startDate: string; endDate: string }) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  error: string | null;
}> = ({ terms, selectedTermId, onSelect, onCreate, onDelete, loading, error }) => {
  // Local state for create form/modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div style={{ width: "100%", maxWidth: 700, margin: "0 auto", padding: 32 }}>
      <h2 style={{ fontSize: 28, marginBottom: 18 }}>Term Management</h2>
      {error && <div style={{ color: "#c00", marginBottom: 12 }}>{error}</div>}
      <button onClick={() => setShowModal(true)} style={{ marginBottom: 18 }}>+ Create Term</button>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {terms.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: "center", color: "#888" }}>No terms found.</td></tr>
          ) : terms.map(term => (
            <tr key={term._id} style={{ background: term._id === selectedTermId ? "#ffe5b4" : undefined }}>
              <td>{term.name}</td>
              <td>{term.startDate.slice(0, 10)}</td>
              <td>{term.endDate.slice(0, 10)}</td>
              <td>
                <button onClick={() => onSelect(term._id)} style={{ marginRight: 8 }}>
                  {term._id === selectedTermId ? "Selected" : "Select"}
                </button>
                <button onClick={() => setDeleteId(term._id)} style={{ color: "#c00" }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Create Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", padding: 32, borderRadius: 10, minWidth: 320 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Create Term</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              setSubmitting(true);
              try {
                await onCreate(form);
                setShowModal(false);
                setForm({ name: "", startDate: "", endDate: "" });
              } finally {
                setSubmitting(false);
              }
            }}>
              <div style={{ marginBottom: 12 }}>
                <label>Name<br /><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Start Date<br /><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required /></label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>End Date<br /><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required /></label>
              </div>
              <button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create"}</button>
              <button type="button" onClick={() => setShowModal(false)} style={{ marginLeft: 12 }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation */}
      {deleteId && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setDeleteId(null)}>
          <div style={{ background: "#fff", padding: 32, borderRadius: 10, minWidth: 320 }} onClick={e => e.stopPropagation()}>
            <h3>Delete Term?</h3>
            <p>Are you sure you want to delete this term?</p>
            <button onClick={async () => { await onDelete(deleteId); setDeleteId(null); }}>Delete</button>
            <button onClick={() => setDeleteId(null)} style={{ marginLeft: 12 }}>Cancel</button>
          </div>
        </div>
      )}
      {loading && <div style={{ color: "#888", marginTop: 12 }}>Loading...</div>}
    </div>
  );
};

// Utility for localStorage key
const DASHBOARD_STEP_KEY = 'dashboardStep';

// On mount, initialize step from localStorage if present
const getInitialStep = () => {
  const saved = localStorage.getItem(DASHBOARD_STEP_KEY);
  if (saved === 'term' || saved === 'excel' || saved === 'select' || saved === 'calendar') {
    return saved;
  }
  return 'term';
};

const DashboardPage: React.FC = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [termLoading, setTermLoading] = useState(false);
  const [termError, setTermError] = useState<string | null>(null);

  // Add step state: 'term' | 'excel' | 'select' | 'calendar'
  const [step, _setStep] = useState<'term' | 'excel' | 'select' | 'calendar'>(getInitialStep());
  const setStep = (newStep: 'term' | 'excel' | 'select' | 'calendar') => {
    _setStep(newStep);
    localStorage.setItem(DASHBOARD_STEP_KEY, newStep);
  };

  // Excel upload state
  const [excelUploadResult, setExcelUploadResult] = useState<any>(null);
  const [excelUploadError, setExcelUploadError] = useState<string | null>(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [defaultCapacity, setDefaultCapacity] = useState<number>(45);
  const [selectedCalendarYear, setSelectedCalendarYear] = useState<string>("1");
  const [calendarSections, setCalendarSections] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  
  // Data for populating details
  const [courses, setCourses] = useState<any[]>([]); // Contains courseCode, name, _id, and hopefully yearLevel
  const [fullSectionsDetails, setFullSectionsDetails] = useState<FullSectionDetail[] | null>(null);
  const [allUsers, setAllUsers] = useState<User[] | null>(null);
  const [allClassrooms, setAllClassrooms] = useState<Classroom[] | null>(null);
  
  // SE course selection state (remains as is)
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [selectSubmitting, setSelectSubmitting] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  // Add checkedCourses state to track which courses are checked
  const [checkedCourses, setCheckedCourses] = useState<Record<string, boolean>>({});

  // Fetch terms on mount or when needed
  useEffect(() => {
    if (step === 'term') {
      setTermLoading(true);
      fetchTerms()
        .then(setTerms)
        .catch(e => setTermError(e.message || 'Failed to load terms'))
        .finally(() => setTermLoading(false));
    }
  }, [step]);

  // Initial data load: terms and courses
  useEffect(() => {
    setTermLoading(true);
    Promise.all([fetchTerms(), fetchCourses()])
      .then(([termsData, coursesData]) => {
        setTerms(termsData);
        // Sort courses: SE first, then alphabetically
        const sortedCourses = [...coursesData].sort((a, b) => {
          const aIsSE = a.courseCode.startsWith('SE');
          const bIsSE = b.courseCode.startsWith('SE');
          if (aIsSE && !bIsSE) return -1;
          if (!aIsSE && bIsSE) return 1;
          return a.courseCode.localeCompare(b.courseCode);
        });
        setCourses(sortedCourses);
        if (termsData.length > 0) setSelectedTermId(termsData[0]._id || termsData[0].id || "");
        setTermLoading(false);
      })
      .catch(err => {
        setTermError(err.message || "Failed to load initial terms/courses");
        setTermLoading(false);
      });
  }, []);

  // Refactor: After course selection, just go to calendar step (do not fetch section details by ID)
  const handleCourseAvailabilitySubmit = async () => {
    setSelectSubmitting(true);
    setSelectError(null);
    setTermError(null);
    setTermLoading(true);
    try {
      const selectedCourseSections = courses
        .filter((c: any) => checkedCourses[c._id] && counts[c._id] && Number(counts[c._id]) > 0)
        .map((c: any) => ({
          courseId: c._id,
          expectedStudents: Number(counts[c._id]),
        }));

      if (selectedCourseSections.length === 0) {
        setSelectError("Please select at least one course and enter expected student numbers.");
        setSelectSubmitting(false);
        setTermLoading(false);
        return;
      }

      if (!selectedTermId) {
        setSelectError("No term selected. Please go back and select a term.");
        setSelectSubmitting(false);
        setTermLoading(false);
        return;
      }

      const dto: BulkSectionDto = {
        termId: selectedTermId,
        sections: selectedCourseSections,
        defaultCapacity,
      };

      await postBulkSchedule(dto); // Only create sections, don't use response for fetching
      setStep("calendar"); // Go to calendar step
    } catch (err: any) {
      setSelectError(
        typeof err === "object" && err && "message" in err
          ? (err.message as string)
          : "Failed to generate schedule."
      );
    } finally {
      setSelectSubmitting(false);
      setTermLoading(false);
    }
  };

  // Fetch sections for the selected year and term when in calendar step
  useEffect(() => {
    if (step === "calendar" && selectedTermId && selectedCalendarYear) {
      setCalendarLoading(true);
      fetchSectionsByTermAndYearLevel(selectedTermId, Number(selectedCalendarYear))
        .then(sections => {
          setCalendarSections(sections.filter((s: any) => Array.isArray(s.sessions) && s.sessions.length > 0));
        })
        .catch(() => setCalendarSections([]))
        .finally(() => setCalendarLoading(false));
    } else if (step === "calendar") {
      setCalendarSections([]); // No year selected
    }
  }, [step, selectedTermId, selectedCalendarYear]);

  // Build sectionMap for CalendarStep
  const preparedSectionMap = useMemo(() => {
    if (!calendarSections) return null;
    const map: SectionMap = {};
    for (const detail of calendarSections) {
      const courseFromSection = detail.course;
      map[detail._id] = {
        _id: detail._id,
        course: {
          courseCode: courseFromSection?.courseCode || 'N/A',
          name: courseFromSection?.name || 'N/A',
        },
        sectionNumber: detail.sectionNumber,
        lecturers: (detail.assignedLecturers || []).join(', '),
        detailedSessions: (detail.sessions || []).map((sess: any) => ({
          sessionId: sess._id,
          lessonType: sess.lessonType,
          days: sess.days,
          timeSlots: sess.timeSlots,
          classroomName: sess.classroom || 'N/A',
        })),
        yearLevel: courseFromSection?.yearLevel ?? courseFromSection?.year,
      };
    }
    return map;
  }, [calendarSections]);

  // Excel file upload (raw file to backend)
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTermId) return;
    setExcelUploading(true);
    setExcelUploadResult(null);
    setExcelUploadError(null);
    setTermError(null);
    try {
      const result = await postLoadSections(file, selectedTermId); // service call
      setExcelUploadResult(result);
      setStep("select"); // Move to next step
    } catch (err: any) {
      setExcelUploadError(err.message || "Failed to upload Excel file");
    } finally {
      setExcelUploading(false);
    }
  };

  // Reset wizard
  const handleStartOver = async () => {
    setTermLoading(true);
    try {
      // Fetch all sections and delete each one
      const allSections = await fetchAllSections();
      await Promise.all(
        allSections.map((section: any) => deleteSectionById(section._id))
      );
    } catch (e) {
      // Optionally handle error (e.g., show a message)
      console.error('Failed to delete all sections:', e);
    } finally {
      setTermLoading(false);
      setStep('term');
      localStorage.removeItem(DASHBOARD_STEP_KEY);
      setExcelUploadResult(null);
      setExcelUploadError(null);
      setCounts({});
      setSelectError(null);
      setFullSectionsDetails(null);
      setTermError(null);
    }
  };

  // Handlers for term management
  const handleCreateTerm = async (data: { name: string; startDate: string; endDate: string }) => {
    setTermLoading(true);
    setTermError(null);
    try {
      await createTerm(data);
      const updated = await fetchTerms();
      setTerms(updated);
    } catch (e: any) {
      setTermError(e.message || 'Failed to create term');
    } finally {
      setTermLoading(false);
    }
  };
  const handleDeleteTerm = async (id: string) => {
    setTermLoading(true);
    setTermError(null);
    try {
      await deleteTerm(id);
      const updated = await fetchTerms();
      setTerms(updated);
      if (selectedTermId === id) setSelectedTermId(null);
    } catch (e: any) {
      setTermError(e.message || 'Failed to delete term');
    } finally {
      setTermLoading(false);
    }
  };
  const handleSelectTerm = (id: string) => setSelectedTermId(id);

  // Stepper UI
  const steps = [
    { key: 'term', label: 'Term Management' },
    { key: 'excel', label: 'Excel Upload' },
    { key: 'select', label: 'Course Selection' },
    { key: 'calendar', label: 'Calendar' },
  ];

  // Ensure selectedTermId is always a string for <select> value and similar usages
  const safeSelectedTermId = selectedTermId || "";

  // When entering calendar step, default year to 1
  useEffect(() => {
    if (step === "calendar") {
      setSelectedCalendarYear("1");
    }
  }, [step]);

  return (
    <div style={{
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "32px 0 48px 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      minHeight: "80vh",
    }}>
      <h2 style={{
        fontSize: "32px",
        color: colors.orange,
        marginBottom: "32px",
        borderBottom: `2px solid ${colors.orange}`,
        paddingBottom: "14px",
        textAlign: "center",
        width: "100%"
      }}>
        University Course Scheduler
      </h2>
      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontWeight: step === s.key ? 700 : 400, color: step === s.key ? '#e87722' : '#888', fontSize: 18 }}>{s.label}</div>
            {i < steps.length - 1 && <div style={{ width: 40, height: 2, background: '#eee', margin: '0 12px' }} />}
          </div>
        ))}
      </div>
      {/* Step content */}
      {step === 'term' && (
        <TermManagementStep
          terms={terms}
          selectedTermId={selectedTermId}
          onSelect={handleSelectTerm}
          onCreate={handleCreateTerm}
          onDelete={handleDeleteTerm}
          loading={termLoading}
          error={termError}
        />
      )}
      {step === 'term' && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={() => setStep('excel')}
            disabled={!selectedTermId || termLoading}
            style={{ fontSize: 18, padding: '10px 32px', background: '#e87722', color: '#fff', border: 'none', borderRadius: 8, opacity: !selectedTermId ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}
      {step === 'excel' && (
        <div style={{
          background: colors.white,
          borderRadius: "16px",
          padding: "32px 32px 24px 32px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          marginBottom: "40px",
          width: "100%",
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h3 style={{ fontSize: "22px", marginTop: 0, marginBottom: "20px", textAlign: "center" }}>Step 1: Upload Sections Excel</h3>
          {termError && <div style={{ color: "red", marginBottom: "16px" }}>{termError}</div>}
          <div style={{ width: "100%", marginBottom: "18px" }}>
            <label htmlFor="term-select" style={{ fontWeight: 600, marginRight: "12px" }}>Select Term:</label>
            <select
              id="term-select"
              value={safeSelectedTermId}
              onChange={e => setSelectedTermId(e.target.value)}
              style={{ padding: "8px 16px", borderRadius: "6px", border: `1px solid ${colors.border}` }}
              disabled={termLoading || terms.length === 0}
            >
              <option value="" disabled>Select a term</option>
              {terms.map(term => (
                <option key={term._id} value={term._id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>
          <label style={{ fontWeight: 600, marginBottom: "10px" }}>
            Upload Excel File (.xlsx):
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              style={{ marginLeft: "12px" }}
              disabled={excelUploading || termLoading}
            />
          </label>
          {excelUploading && (
            <div style={{ color: colors.orange, marginTop: "10px" }}>Uploading...</div>
          )}
          {excelUploadResult && (
            <div style={{ color: colors.success, marginTop: "10px" }}>
              Uploaded! Created: {excelUploadResult.created}, Skipped: {excelUploadResult.skipped}
              {excelUploadResult.details && excelUploadResult.details.length > 0 && (
                <details style={{ marginTop: "6px" }}>
                  <summary>Details</summary>
                  <ul>
                    {excelUploadResult.details.map((d: any, idx: number) => (
                      <li key={idx}>
                        {d.identifier}: {d.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          {excelUploadError && (
            <div style={{ color: colors.error, marginTop: "10px" }}>{excelUploadError}</div>
          )}
          {/* Back button for Excel step only */}
          <button
            onClick={() => setStep('term')}
            style={{
              marginTop: 18,
              background: colors.white,
              color: colors.orange,
              border: `1.5px solid ${colors.orange}`,
              borderRadius: "6px",
              padding: "8px 18px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      )}
      {step === 'select' && (
         <div
          style={{
            background: colors.white,
            borderRadius: "16px",
            padding: "32px 32px 24px 32px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            marginBottom: "40px",
            width: "100%",
            maxWidth: "1000px", // Can be wider for the table
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h3 style={{ fontSize: "22px", marginTop: 0, marginBottom: "20px", textAlign: "center" }}>
            Step 2: Select Courses & Set Expected Students
          </h3>
          {/* Search input - unchanged */}
          <div style={{ marginBottom: 18, width: "100%", maxWidth: 420 }}>
            <input
              type="text"
              placeholder="Search courses..."
              value={counts["__search"] || ""}
              onChange={e =>
                setCounts(prev => ({
                  ...prev,
                  __search: e.target.value,
                }))
              }
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                fontSize: "15px",
              }}
            />
          </div>
          {/* Courses Table - unchanged */}
          <div
            style={{
              width: "100%",
              maxHeight: "500px", // Added for scrollability if many courses
              overflowY: "auto",
              background: colors.white,
              borderRadius: "16px", // Keep consistent styling
              boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
              marginBottom: "32px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700, position: 'sticky', top: 0, zIndex: 1 }}>
                    Select
                  </th>
                  <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700, position: 'sticky', top: 0, zIndex: 1 }}>
                    Course Code
                  </th>
                  <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700, position: 'sticky', top: 0, zIndex: 1 }}>
                    Name
                  </th>
                  <th style={{ padding: "12px", background: colors.lightGray, color: colors.orange, fontWeight: 700, position: 'sticky', top: 0, zIndex: 1 }}>
                    Expected Students
                  </th>
                </tr>
              </thead>
              <tbody>
                {termLoading && !courses.length ? ( // Show loading only if courses aren't there yet
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: colors.orange }}>
                      Loading courses...
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: colors.darkGray }}>
                      No courses found.
                    </td>
                  </tr>
                ) : (
                  courses
                    .filter(
                      (c: any) =>
                        !counts["__search"] ||
                        (c.courseCode || "").toLowerCase().includes((counts["__search"] || "").toLowerCase()) ||
                        (c.name || "").toLowerCase().includes((counts["__search"] || "").toLowerCase())
                    )
                    .map((course: any) => (
                      <tr key={course._id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ textAlign: "center", padding: "8px" }}>
                          <input
                            type="checkbox"
                            checked={!!checkedCourses[course._id]}
                            onChange={e => {
                              setCheckedCourses(prev => ({ ...prev, [course._id]: e.target.checked }));
                              // If unchecking, also clear the input value
                              if (!e.target.checked) {
                                setCounts(prev => {
                                  const copy = { ...prev };
                                  delete copy[course._id];
                                  return copy;
                                });
                              } else {
                                // If checking, set a default value if not already set
                                setCounts(prev => ({ ...prev, [course._id]: prev[course._id] || "" }));
                              }
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 600, color: colors.darkGray, padding: "8px" }}>{course.courseCode}</td>
                        <td style={{ color: colors.black, padding: "8px" }}>{course.name}</td>
                        <td style={{ padding: "8px" }}>
                          <input
                            type="number"
                            min={1}
                            value={counts[course._id] || ""}
                            onChange={e =>
                              setCounts(prev => ({
                                ...prev,
                                [course._id]: e.target.value.replace(/\D/g, ""),
                              }))
                            }
                            style={{
                              width: 80,
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: `1px solid ${colors.border}`,
                              fontSize: 15,
                            }}
                            // Enable input if checkbox is checked
                            disabled={!checkedCourses[course._id]}
                          />
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          {/* Submit Button */}
          <button
            onClick={handleCourseAvailabilitySubmit} // Use the new handler
            disabled={
              selectSubmitting ||
              !courses.some((c: any) => checkedCourses[c._id] && counts[c._id] && Number(counts[c._id]) > 0)
            }
            style={{
              marginTop: 12,
              background: colors.orange, // Use theme color
              color: colors.white,
              fontWeight: 700,
              fontSize: "16px",
              borderRadius: "6px",
              border: "none",
              padding: "10px 24px",
              opacity: selectSubmitting ? 0.7 : 1,
              cursor: selectSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {selectSubmitting ? "Generating Schedule..." : "Generate Schedule"}
          </button>
          {selectError && <div style={{ color: colors.error, marginTop: 10 }}>{selectError}</div>}
          <button
            onClick={handleStartOver}
            style={{
              marginTop: 18,
              background: colors.white,
              color: colors.orange,
              border: `1.5px solid ${colors.orange}`,
              borderRadius: "6px",
              padding: "8px 18px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Start Over
          </button>
        </div>
      )}
      {step === 'calendar' && (
        <div style={{
          background: colors.white,
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          padding: "24px 16px",
          marginTop: "16px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Year Filter Dropdown */}
          <div style={{ marginBottom: 18, width: "100%", maxWidth: 350, alignSelf: 'flex-start', display: 'flex', alignItems: 'center' }}>
            <label htmlFor="year-filter-select" style={{ fontWeight: 600, color: colors.orange, marginRight: 12, whiteSpace: 'nowrap' }}>
              Select Year:
            </label>
            <select
              id="year-filter-select"
              value={selectedCalendarYear}
              onChange={e => setSelectedCalendarYear(e.target.value)}
              style={{ flexGrow: 1, padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, fontSize: 15 }}
            >
              {[1, 2, 3, 4].map(y => (
                <option key={y} value={String(y)}>Year {y}</option>
              ))}
            </select>
          </div>
          {calendarLoading && <div style={{padding: "20px", color: colors.orange }}>Loading calendar data...</div>}
          {preparedSectionMap && Object.keys(preparedSectionMap).length > 0 ? (
            <CalendarStep sectionMap={preparedSectionMap} />
          ) : (
            !calendarLoading && <div style={{padding: "20px", color: colors.darkGray}}>No schedule data to display for the selected year.</div>
          )}
          <button
            onClick={handleStartOver}
            style={{
              marginTop: 18,
              background: colors.white,
              color: colors.orange,
              border: `1.5px solid ${colors.orange}`,
              borderRadius: "6px",
              padding: "8px 18px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
