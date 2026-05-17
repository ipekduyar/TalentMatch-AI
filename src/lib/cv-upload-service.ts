import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  clearMockCvMetadata,
  getMockCvMetadata,
  saveMockCvMetadata,
  type MockCvMetadata,
} from "@/lib/mock-cv-storage";

export type CvUploadStatus = "idle" | "uploading" | "uploaded" | "failed";

export type CvUploadResult = {
  fileName: string;
  fileSizeBytes: number;
  uploadedAtIso: string;
  status: Exclude<CvUploadStatus, "idle" | "uploading">;
  errorMessage?: string;
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const getStudentIdForCurrentUser = async (): Promise<string> => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const user = authData.user;
  if (!user) {
    throw new Error("You must be logged in to upload a CV.");
  }

  const { data: person, error: personError } = await supabase
    .from("persons")
    .select("person_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (personError) throw personError;
  if (!person?.person_id) {
    throw new Error("No student profile found for this account.");
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("student_id")
    .eq("person_id", person.person_id)
    .maybeSingle();

  if (studentError) throw studentError;
  if (!student?.student_id) {
    throw new Error("No student profile found for this account.");
  }

  return student.student_id;
};

export const uploadStudentCv = async (file: File): Promise<CvUploadResult> => {
  const uploadedAtIso = new Date().toISOString();

  if (!isSupabaseConfigured || !supabase) {
    const metadata: MockCvMetadata = {
      fileName: file.name,
      fileSizeBytes: file.size,
      uploadedAtIso,
    };

    saveMockCvMetadata(metadata);
    return {
      ...metadata,
      status: "uploaded",
    };
  }

  const studentId = await getStudentIdForCurrentUser();
  const safeName = sanitizeFileName(file.name);
  const path = `students/${studentId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("student-cvs")
    .upload(path, file, { upsert: false, contentType: file.type || undefined });

  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from("student_documents").insert({
    student_id: studentId,
    file_path: path,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type || "application/octet-stream",
    upload_status: "uploaded",
  });

  if (insertError) throw insertError;

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    uploadedAtIso,
    status: "uploaded",
  };
};

export const getStoredCvMetadata = () => getMockCvMetadata();

export const removeStoredCvMetadata = () => {
  clearMockCvMetadata();
};
