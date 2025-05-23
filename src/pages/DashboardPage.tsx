import React, { useState, useEffect, useMemo } from "react";
import { colors } from "../theme/colors";
// fetchSectionsByTerm exists, fetchAllUsers and fetchAllClassrooms do not yet.
import { fetchTerms, fetchCourses, fetchSectionsByTerm, fetchSectionById } from "../services/auth"; 
// Placeholder for future services:
// import { fetchAllUsers, fetchAllClassrooms } from "../services/data"; // (if moved to a new file)
import { postBulkSchedule, postLoadSections } from "../services/bulkSchedule";
import type { BulkSectionDto } from "../types/BulkSectionDto";
import CalendarStep from "./CalendarStep"; // Import CalendarStep

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


const DashboardPage: React.FC = () => {
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [scheduleData, setScheduleData] = useState<BackendScheduleResultDto | null>(null); // Typed scheduleData
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step state: "upload" | "select" | "calendar"
  const [step, setStep] = useState<"upload" | "select" | "calendar">("upload");

  // Excel upload state
  const [excelUploadResult, setExcelUploadResult] = useState<any>(null);
  const [excelUploadError, setExcelUploadError] = useState<string | null>(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [defaultCapacity, setDefaultCapacity] = useState<number>(45);
  const [selectedCalendarYear, setSelectedCalendarYear] = useState<string>(""); // "" for All Years
  
  // Data for populating details
  const [courses, setCourses] = useState<any[]>([]); // Contains courseCode, name, _id, and hopefully yearLevel
  const [fullSectionsDetails, setFullSectionsDetails] = useState<FullSectionDetail[] | null>(null);
  const [allUsers, setAllUsers] = useState<User[] | null>(null);
  const [allClassrooms, setAllClassrooms] = useState<Classroom[] | null>(null);
  
  // SE course selection state (remains as is)
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [selectSubmitting, setSelectSubmitting] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  // Initial data load: terms and courses
  useEffect(() => {
    setLoading(true);
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
        if (termsData.length > 0) setSelectedTerm(termsData[0]._id || termsData[0].id || "");
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to load initial terms/courses");
        setLoading(false);
      });
  }, []);

  // Fetch detailed data when selectedTerm changes, if not already fetched for this term
  // useEffect(() => {
  //   if (selectedTerm && step === "calendar") {
  //     setLoading(true);
  //     fetchSectionsByTerm(selectedTerm)
  //       .then((sections) => {
  //         setFullSectionsDetails(sections);
  //         setAllUsers([]); 
  //         setAllClassrooms([]);
  //       })
  //       .catch(err => {
  //         setError(err.message || "Failed to load detailed section data");
  //         setFullSectionsDetails([]);
  //         setAllUsers([]);
  //         setAllClassrooms([]);
  //       })
  //       .finally(() => {
  //         setLoading(false);
  //       });
  //   }
  // }, [selectedTerm, step]);


  // Prepare sectionMap for CalendarStep
  const preparedSectionMap = useMemo<SectionMap | null>(() => {
    if (!scheduleData || !fullSectionsDetails) { 
      return null;
    }

    const map: SectionMap = {};
    const usersArray = allUsers || []; 
    const classroomsArray = allClassrooms || []; 

    for (const detail of fullSectionsDetails) {
      // Since detail.course is now an object (populated by backend or fetchSectionsByTerm)
      const courseFromSection = detail.course; 

      map[detail._id] = {
        _id: detail._id,
        course: {
          courseCode: courseFromSection?.courseCode || 'N/A',
          name: courseFromSection?.name || 'N/A',
        },
        sectionNumber: detail.sectionNumber,
        lecturers: detail.assignedLecturers
          .map(lecturerId => usersArray.find(u => u._id === lecturerId)?.name)
          .filter(Boolean)
          .join(', ') || (usersArray.length === 0 ? "N/A (Users not loaded)" : "N/A"),
        detailedSessions: detail.sessions.map(sess => ({
          sessionId: sess._id,
          lessonType: sess.lessonType,
          days: sess.days,
          timeSlots: sess.timeSlots,
          classroomName: classroomsArray.find(cr => cr._id === sess.classroom)?.name || (classroomsArray.length === 0 ? "N/A (Rooms not loaded)" : "N/A"),
        })),
        // Use yearLevel or year from the populated course object within the section detail
        yearLevel: courseFromSection?.yearLevel ?? courseFromSection?.year, 
      };
    }
    return map;
  }, [scheduleData, fullSectionsDetails, allUsers, allClassrooms]); // Removed 'courses' from dependency array as it's not directly used for courseInfo anymore

  // Filter data for CalendarStep based on selectedCalendarYear
  const filteredDataForCalendar = useMemo(() => {
    if (!scheduleData || !preparedSectionMap) {
      return { filteredSchedule: null, filteredMap: null };
    }

    if (!selectedCalendarYear || selectedCalendarYear === "") { // "All Years"
      return { filteredSchedule: scheduleData, filteredMap: preparedSectionMap };
    }

    const yearToFilter = parseInt(selectedCalendarYear, 10);
    const newFilteredMap: SectionMap = {};
    const allowedSectionIds = new Set<string>();

    for (const sectionId in preparedSectionMap) {
      const sectionEntry = preparedSectionMap[sectionId];
      // Log the values being compared for filtering
      console.log(
        `Filtering Check: sectionId=${sectionId}, sectionYear=${sectionEntry.yearLevel} (type: ${typeof sectionEntry.yearLevel}), filterYear=${yearToFilter} (type: ${typeof yearToFilter})`
      );
      if (sectionEntry.yearLevel === yearToFilter) {
        newFilteredMap[sectionId] = sectionEntry;
        allowedSectionIds.add(sectionId);
      }
    }

    const newFilteredScheduleAssignments = scheduleData.schedule.filter(assignment =>
      allowedSectionIds.has(assignment.sectionId)
    );

    return {
      filteredSchedule: { ...scheduleData, schedule: newFilteredScheduleAssignments },
      filteredMap: newFilteredMap,
    };
  }, [scheduleData, preparedSectionMap, selectedCalendarYear]);


  // Excel file upload (raw file to backend)
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTerm) return;
    setExcelUploading(true);
    setExcelUploadResult(null);
    setExcelUploadError(null);
    setError(null);
    try {
      const result = await postLoadSections(file, selectedTerm); // service call
      setExcelUploadResult(result);
      setStep("select"); // Move to next step
    } catch (err: any) {
      setExcelUploadError(err.message || "Failed to upload Excel file");
    } finally {
      setExcelUploading(false);
    }
  };

  // Course selection submit (Step 2)
  // This function is called by both the original SE course submit and the new all courses submit button
  const handleCourseAvailabilitySubmit = async () => {
    setSelectSubmitting(true);
    setSelectError(null);
    setError(null);
    setLoading(true);
    try {
      const selectedCourseSections = courses
        .filter((c: any) => counts[c._id] && Number(counts[c._id]) > 0)
        .map((c: any) => ({
          courseId: c._id,
          expectedStudents: Number(counts[c._id]),
        }));

      if (selectedCourseSections.length === 0) {
        setSelectError("Please select at least one course and enter expected student numbers.");
        setSelectSubmitting(false);
        setLoading(false);
        return;
      }

      const dto: BulkSectionDto = {
        termId: selectedTerm,
        sections: selectedCourseSections,
        defaultCapacity,
      };
      const result = await postBulkSchedule(dto); // service call
      setScheduleData(result);
      setFullSectionsDetails(null); // Reset detailed data

      // New: Fetch each section by ID in parallel
      const sectionIds = (result.schedule || []).map((s: any) => s.sectionId);
      const sectionDetails = await Promise.all(sectionIds.map((id: string) => fetchSectionById(id)));
      setFullSectionsDetails(sectionDetails);
      setStep("calendar"); // Move to calendar step
    } catch (err: any) {
      setSelectError(
        typeof err === "object" && err && "message" in err
          ? (err.message as string)
          : "Failed to generate schedule."
      );
    } finally {
      setSelectSubmitting(false);
      setLoading(false);
    }
  };
  
  // Reset wizard
  const handleStartOver = () => {
    setStep("upload");
    setExcelUploadResult(null);
    setExcelUploadError(null);
    setCounts({});
    setSelectError(null);
    setScheduleData(null);
    // Reset detailed data states
    setFullSectionsDetails(null);
    // allUsers and allClassrooms are fetched once per term, could be kept or reset
    // For simplicity, let's reset them if we want fresh data on next calendar view.
    // However, if they are term-agnostic (like all users in system), no need to reset.
    // Assuming users and classrooms are general, not term-specific for now.
    // If they were term specific, they'd be reset and refetched by the useEffect for selectedTerm.
    setError(null);
  };

  // The existing filter for SE courses is removed as Step 2 now handles all courses.
  // The search/filter logic within Step 2's table remains.

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
      {/* Step 1: Excel Upload (Largely unchanged) */}
      {step === "upload" && (
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
          {error && <div style={{ color: "red", marginBottom: "16px" }}>{error}</div>}
          <div style={{ width: "100%", marginBottom: "18px" }}>
            <label htmlFor="term-select" style={{ fontWeight: 600, marginRight: "12px" }}>Select Term:</label>
            <select
              id="term-select"
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              style={{ padding: "8px 16px", borderRadius: "6px", border: `1px solid ${colors.border}` }}
              disabled={loading || terms.length === 0}
            >
              {terms.map(term => (
                <option key={term._id || term.id} value={term._id || term.id}>
                  {term.name || term.termName || term._id || term.id}
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
              disabled={excelUploading || loading}
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
        </div>
      )}

      {/* Step 2: Course Selection (Largely unchanged, but submit button calls new handler) */}
      {step === "select" && (
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
                {loading && !courses.length ? ( // Show loading only if courses aren't there yet
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
                            checked={!!counts[course._id] && Number(counts[course._id]) > 0}
                            onChange={e => {
                              if (!e.target.checked) {
                                setCounts(prev => {
                                  const copy = { ...prev };
                                  delete copy[course._id];
                                  return copy;
                                });
                              } else {
                                setCounts(prev => ({
                                  ...prev,
                                  [course._id]: prev[course._id] || "1", // Default to 1 if checked
                                }));
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
                            disabled={!(!!counts[course._id] && Number(counts[course._id]) >= 0)}
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
              !courses.some((c: any) => counts[c._id] && Number(counts[c._id]) > 0)
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

      {/* Step 3: Calendar - Replaced with CalendarStep */}
      {step === "calendar" && (
        <div style={{
          // overflowX: "auto", // CalendarStep might handle its own scrolling/layout
          background: colors.white,
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          padding: "24px 16px", // Keep padding
          marginTop: "16px",
          width: "100%", // Allow CalendarStep to manage its width
          // maxWidth: "1000px", // CalendarStep might need more or less
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Year Filter Dropdown */}
          <div style={{ marginBottom: 18, width: "100%", maxWidth: 350, alignSelf: 'flex-start', display: 'flex', alignItems: 'center' }}>
            <label htmlFor="year-filter-select" style={{ fontWeight: 600, color: colors.orange, marginRight: 12, whiteSpace: 'nowrap' }}>
              Filter by Year:
            </label>
            <select
              id="year-filter-select"
              value={selectedCalendarYear}
              onChange={e => setSelectedCalendarYear(e.target.value)}
              style={{ flexGrow: 1, padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, fontSize: 15 }}
            >
              <option value="">All Years</option>
              {[1, 2, 3, 4].map(y => ( // Assuming 4 years, adjust if needed
                <option key={y} value={String(y)}>Year {y}</option>
              ))}
            </select>
          </div>
          
          {loading && (!filteredDataForCalendar.filteredSchedule || !filteredDataForCalendar.filteredMap) && <div style={{padding: "20px", color: colors.orange }}>Loading calendar data...</div>}

          {filteredDataForCalendar.filteredSchedule && filteredDataForCalendar.filteredMap ? (
            <CalendarStep
              scheduleData={filteredDataForCalendar.filteredSchedule}
              sectionMap={filteredDataForCalendar.filteredMap}
            />
          ) : (
            !loading && <div style={{padding: "20px", color: colors.darkGray}}>No schedule data to display for the selected year or still preparing.</div>
          )}
          <button
            onClick={handleStartOver}
            style={{
              marginTop: 18,
              background: colors.white, // Use theme color
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
