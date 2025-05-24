import React, { useMemo } from "react";

// Types for the richer sectionMap prop
interface RichSectionDetailedSession {
  sessionId: string;
  lessonType: 'Lecture' | 'Lab';
  days: string[];
  timeSlots: { start: string; end: string }[];
  classroomName?: string;
}
interface RichSectionMapEntry {
  _id: string; // sectionId
  course: { courseCode: string; name: string };
  sectionNumber: number;
  lecturers?: string;
  detailedSessions?: RichSectionDetailedSession[];
  yearLevel?: number;
}
interface SectionMap {
  [sectionId: string]: RichSectionMapEntry;
}

type Props = {
  sectionMap: SectionMap;
};

// Helper: Sort time in HH:MM format
function compareTime(a: string, b: string) {
  return a.localeCompare(b);
}

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper to generate a consistent color from a string (courseCode)
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 80%)`;
}

// Helper to determine if text should be dark or white based on bg color
function isLightColor(bg: string) {
  // crude: check if it's a light HSL
  const match = bg.match(/hsl\(\d+, (\d+)%?, (\d+)%?\)/);
  if (match && parseInt(match[2], 10) > 60) return true;
  return false;
}

const CalendarStep: React.FC<Props> = ({ sectionMap }) => {
  console.log("CalendarStep received sectionMap:", JSON.stringify(sectionMap, null, 2));
  // 1. Flatten all sessions into a list of { day, start, end, courseCode, sectionNumber, lessonType }
  const calendarEntries = useMemo(() => {
    const entries: Array<{
      day: string;
      start: string;
      end: string;
      courseCode: string;
      sectionNumber: number;
      lessonType: string;
    }> = [];
    Object.values(sectionMap).forEach(section => {
      section.detailedSessions?.forEach(session => {
        session.days.forEach(day => {
          session.timeSlots.forEach(slot => {
            entries.push({
              day,
              start: slot.start,
              end: slot.end,
              courseCode: section.course.courseCode,
              sectionNumber: section.sectionNumber,
              lessonType: session.lessonType,
            });
          });
        });
      });
    });
    return entries;
  }, [sectionMap]);

  // 2. Build unique sorted list of time slots
  const allTimeSlots = useMemo(() => {
    const set = new Set<string>();
    calendarEntries.forEach(e => set.add(`${e.start}-${e.end}`));
    return Array.from(set)
      .map(str => {
        const [start, end] = str.split("-");
        return { start, end };
      })
      .sort((a, b) => compareTime(a.start, b.start));
  }, [calendarEntries]);

  // 3. Build unique list of days (ordered)
  const allDays = useMemo(() => {
    const set = new Set(calendarEntries.map(e => e.day));
    return dayOrder.filter(day => set.has(day));
  }, [calendarEntries]);

  // 4. Build a lookup: { [day]: { [start-end]: [sessionInfo, ...] } }
  const calendarGrid = useMemo(() => {
    const grid: Record<string, Record<string, typeof calendarEntries>> = {};
    allDays.forEach(day => {
      grid[day] = {};
      allTimeSlots.forEach(slot => {
        grid[day][`${slot.start}-${slot.end}`] = calendarEntries.filter(
          e => e.day === day && e.start === slot.start && e.end === slot.end
        );
      });
    });
    return grid;
  }, [allDays, allTimeSlots, calendarEntries]);

  return (
    <div style={{ overflowX: "auto", width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 24 }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ padding: 8, background: "#f5f5f5", border: "1px solid #eee", minWidth: 100 }}>Time</th>
            {allDays.map(day => (
              <th key={day} style={{ padding: 8, background: "#f5f5f5", border: "1px solid #eee", minWidth: 120 }}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allTimeSlots.map(slot => (
            <tr key={`${slot.start}-${slot.end}`}>
              <td style={{ padding: 8, background: "#fafafa", border: "1px solid #eee", fontWeight: 600 }}>
                {slot.start} - {slot.end}
              </td>
              {allDays.map(day => (
                <td key={day} style={{ padding: 8, border: "1px solid #eee", verticalAlign: "top" }}>
                  {calendarGrid[day][`${slot.start}-${slot.end}`].length === 0 ? (
                    <span style={{ color: "#bbb" }}>—</span>
                  ) : (
                    calendarGrid[day][`${slot.start}-${slot.end}`].map((entry, idx) => {
                      const section = Object.values(sectionMap).find(
                        s => s.course.courseCode === entry.courseCode && s.sectionNumber === entry.sectionNumber
                      );
                      const bgColor = stringToColor(entry.courseCode);
                      const textColor = isLightColor(bgColor) ? '#1a1a1a' : '#fff';
                      return (
                        <React.Fragment key={idx}>
                          <div
                            style={{
                              marginBottom: 8,
                              padding: "10px 12px",
                              borderRadius: 10,
                              background: bgColor,
                              color: textColor,
                              fontWeight: 500,
                              fontSize: 15,
                              border: entry.lessonType === "Lab" ? "2px solid #4bbf73" : "2px solid #6fa8dc",
                              boxShadow: "0 2px 8px #0002",
                              display: "block",
                              position: "relative",
                              transition: 'box-shadow 0.2s, transform 0.2s',
                              cursor: 'pointer',
                            }}
                            onMouseOver={e => {
                              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px #0003';
                              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px) scale(1.03)';
                            }}
                            onMouseOut={e => {
                              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px #0002';
                              (e.currentTarget as HTMLDivElement).style.transform = 'none';
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: 16 }}>{entry.courseCode} - {entry.sectionNumber}</span>
                              {entry.lessonType === "Lab" && (
                                <span style={{
                                  background: "#4bbf73",
                                  color: "#fff",
                                  borderRadius: 5,
                                  fontSize: 12,
                                  padding: "2px 8px",
                                  marginLeft: 8,
                                  fontWeight: 700,
                                  letterSpacing: 0.5,
                                  boxShadow: '0 1px 4px #0001',
                                }}>Lab</span>
                              )}
                            </div>
                            {/* Assigned Lecturer */}
                            {section && section.lecturers && section.lecturers.trim() !== "" && (
                              <div style={{
                                marginTop: 7,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 2,
                                fontStyle: "italic",
                                color: textColor === '#fff' ? '#f9e79f' : '#666',
                                fontSize: 13,
                                background: textColor === '#fff' ? 'rgba(255,255,255,0.08)' : '#f6f6f6',
                                borderRadius: 4,
                                padding: "2px 6px 2px 4px",
                                boxShadow: "0 1px 2px #0001",
                              }}>
                                {section.lecturers.split(',').map((name, i) => (
                                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 15, color: textColor === '#fff' ? '#ffe066' : "#b8860b" }}>👨‍🏫</span>
                                    <span>{name.trim()}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Divider between multiple entries in the same cell */}
                          {idx < calendarGrid[day][`${slot.start}-${slot.end}`].length - 1 && (
                            <hr style={{ border: 0, borderTop: "1px dashed #ddd", margin: "6px 0" }} />
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CalendarStep;
