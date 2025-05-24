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
                    calendarGrid[day][`${slot.start}-${slot.end}`].map((entry, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: 4,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: entry.lessonType === "Lab" ? "#d1e7dd" : "#cfe2ff",
                          color: entry.lessonType === "Lab" ? "#0a3622" : "#052c65",
                          fontWeight: 500,
                          fontSize: 14,
                          border: entry.lessonType === "Lab" ? "1.5px solid #a3cfbb" : "1.5px solid #a9c7f0",
                          display: "inline-block",
                        }}
                      >
                        {entry.courseCode} - {entry.sectionNumber}
                        {entry.lessonType === "Lab" ? " (Lab)" : ""}
                      </div>
                    ))
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
