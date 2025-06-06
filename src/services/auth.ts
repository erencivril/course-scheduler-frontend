export async function loginAdmin(email: string, password: string): Promise<string> {
  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMsg = "Login failed";
    try {
      const error = await response.json();
      if (typeof error.message === "string") errorMsg = error.message;
      else if (typeof error.message === "object") errorMsg = JSON.stringify(error.message);
      else errorMsg = JSON.stringify(error);
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  if (!data.accessToken) {
    throw new Error("No access token returned");
  }
  return data.accessToken;
}

export async function fetchCourses(): Promise<any[]> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch("http://localhost:3000/courses", {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch courses");
  }
  return response.json();
}

export async function fetchTerms(): Promise<any[]> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch("http://localhost:3000/terms", {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch terms");
  }
  return response.json();
}

export async function generateSchedule(termId: string): Promise<any> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch(`http://localhost:3000/schedule/${termId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to generate schedule");
  }
  return response.json();
}

export async function fetchSchedule(termId: string): Promise<any> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch(`http://localhost:3000/schedule/${termId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch schedule");
  }
  return response.json();
}

export async function fetchCourseById(courseCode: string): Promise<any> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch(`http://localhost:3000/courses/${courseCode}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch course details");
  }
  return response.json();
}

export async function fetchSectionsByTerm(termId: string): Promise<any[]> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  // Try to use a query param if supported, otherwise fetch all and filter
  const response = await fetch(`http://localhost:3000/sections`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch sections");
  }
  const allSections = await response.json();
  // Filter by termId in frontend
  return allSections.filter((section: any) => section.term === termId);
}

export async function fetchSectionById(sectionId: string): Promise<any> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch(`http://localhost:3000/sections/${sectionId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch section details");
  }
  return response.json();
}

export async function createTerm(term: { name: string; startDate: string; endDate: string }): Promise<any> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch("http://localhost:3000/terms", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(term)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create term");
  }
  return response.json();
}

export async function deleteTerm(termId: string): Promise<void> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch(`http://localhost:3000/terms/${termId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete term");
  }
}

export async function fetchSectionsByTermAndYearLevel(termId: string, yearLevel: number): Promise<any[]> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch(`http://localhost:3000/sections/term/${termId}/year/${yearLevel}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch sections by term and yearLevel");
  }
  // Filter out sections where course is null (due to populate match)
  const allSections = await response.json();
  return allSections.filter((section: any) => section.course);
}

export async function fetchAllSections(): Promise<any[]> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch("http://localhost:3000/sections", {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch all sections");
  }
  return response.json();
}

export async function deleteSectionById(sectionId: string): Promise<void> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch(`http://localhost:3000/sections/${sectionId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete section");
  }
} 