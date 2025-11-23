"use server";

import { z } from "zod";

// Mock user for actions, replace with real auth
const mockUserId = "user_mock_123";

export async function login(prevState: any, formData: FormData) {
  // In a real app, you would handle authentication here.
  // This is a simplified version.
  const email = formData.get("email");
  if (email) {
    console.log("Login action triggered for:", email);
    return { success: true, message: "Logged in successfully (mocked)." };
  }
  return { success: false, message: "Email is required." };
}

export async function signup(prevState: any, formData: FormData) {
  const email = formData.get("email");
  if (email) {
    console.log("Signup action triggered for:", email);
    return { success: true, message: "Signed up successfully (mocked)." };
  }
  return { success: false, message: "Invalid data." };
}

const ReportSchema = z.object({
  category: z.enum(["disaster", "personal"]),
  subtype: z.string().min(1, "Subtype is required."),
  note: z.string().optional(),
  peopleCount: z.coerce.number().min(1).optional(),
  injured: z.string().transform(value => value === 'on').optional(),
  risk: z.enum(["low", "medium", "high"]),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export async function createReport(data: FormData) {
  console.log("Create report action triggered");
  const validatedFields = ReportSchema.safeParse(Object.fromEntries(data.entries()));

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Invalid data submitted." };
  }

  const { lat, lng, ...reportData } = validatedFields.data;

  const newReport = {
    ...reportData,
    uid: mockUserId,
    geo: (lat && lng) ? { lat, lng } : undefined,
    status: 'queued',
    createdAt: new Date(),
  };

  console.log("New Report Payload (mock):", newReport);
  // In a real app, you would save this to a database (e.g., Firestore)
  // and this would trigger the onReportCreated Cloud Function.
  
  return { success: true, message: "Report created successfully (mocked).", report: newReport };
}


const ProfileSchema = z.object({
    name: z.string().min(1, "Name is required."),
    ageRange: z.enum(['0-17', '18-64', '65+']),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    consent: z.string().transform(value => value === 'on'),
});


export async function updateProfile(data: FormData) {
  console.log("Update profile action triggered");
  const validatedFields = ProfileSchema.safeParse(Object.fromEntries(data.entries()));

  if (!validatedFields.success) {
    console.error(validatedFields.error);
    return { success: false, message: "Invalid data." };
  }
  
  console.log("Updated Profile Data (mock):", validatedFields.data);
  // In a real app, you would update the user profile in the database.
  return { success: true, message: "Profile updated successfully (mocked)." };
}

const OrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required."),
  webhookUrl: z.string().url("Must be a valid URL."),
  secret: z.string().min(8, "Secret must be at least 8 characters long."),
});

export async function createOrganization(prevState: any, formData: FormData) {
    console.log("Create organization action triggered");
    const validatedFields = OrganizationSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        console.error(errors);
        return { success: false, message: Object.values(errors).flat().join(', ') };
    }

    const { secret, ...orgData } = validatedFields.data;
    const newOrg = {
      ...orgData,
      secretHash: `hashed_${secret}` // In a real app, use a proper hashing library
    }

    console.log("New Organization Data (mock):", newOrg);
    // In a real app, you would save this to the database.
    return { success: true, message: "Organization created successfully (mocked)." };
}
