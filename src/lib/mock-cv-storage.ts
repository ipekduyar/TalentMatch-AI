export type MockCvMetadata = {
  fileName: string;
  fileSizeBytes: number;
  uploadedAtIso: string;
};

const STORAGE_KEY = "talentmatch.mockCvMetadata";

export const MOCK_PARSED_SKILLS = [
  "Python",
  "SQL",
  "Communication",
  "Product Management",
  "Excel",
] as const;

export const saveMockCvMetadata = (metadata: MockCvMetadata) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
};

export const getMockCvMetadata = (): MockCvMetadata | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<MockCvMetadata>;
    if (!parsed.fileName || !parsed.fileSizeBytes || !parsed.uploadedAtIso) {
      return null;
    }

    return {
      fileName: parsed.fileName,
      fileSizeBytes: parsed.fileSizeBytes,
      uploadedAtIso: parsed.uploadedAtIso,
    };
  } catch {
    return null;
  }
};

export const clearMockCvMetadata = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const formatCvFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
