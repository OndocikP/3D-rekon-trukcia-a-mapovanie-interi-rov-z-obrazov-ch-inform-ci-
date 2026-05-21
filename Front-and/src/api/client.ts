/**
 * API Client pre komunikáciu s BackendmiBackend API
 * Používa fetch API pre požiadavky
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Generic fetch helper s error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.detail || data.message || "Unknown error",
      };
    }

    return { data };
  } catch (error) {
    console.error("API Error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

/**
 * Registruj nového používateľa
 */
export async function register(
  data: RegisterData
): Promise<ApiResponse<AuthResponse["user"]>> {
  return apiCall("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Prihláš používateľa
 */
export async function login(
  credentials: LoginCredentials
): Promise<ApiResponse<AuthResponse>> {
  return apiCall("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/**
 * Zaslanie žiadosti o obnovenie hesla
 */
export async function forgotPassword(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Overenie reset kódu
 */
export async function verifyResetCode(
  email: string,
  resetCode: string
): Promise<ApiResponse<{ valid: boolean; message: string }>> {
  return apiCall("/api/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ email, reset_code: resetCode }),
  });
}

/**
 * Obnovenie hesla s reset kódom
 */
export async function resetPassword(
  email: string,
  resetCode: string,
  newPassword: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, reset_code: resetCode, new_password: newPassword }),
  });
}

/**
 * Získaj aktuálneho používateľa
 */
export async function getCurrentUser(
  token: string
): Promise<ApiResponse<AuthResponse["user"]>> {
  return apiCall("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ============================================
// PROJECT ENDPOINTS
// ============================================

export interface Project {
  id: string;
  project_name: string;
  status: "pending" | "generating" | "generated" | "failed";
  description?: string;
  image_count: number;
  objects?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  project_name: string;
  description?: string;
  objects?: string;
}

export interface UpdateProjectData {
  project_name?: string;
  description?: string;
  status?: "pending" | "generating" | "generated" | "failed";
  objects?: string;
}

/**
 * Vytvor nový projekt
 */
export async function createProject(
  data: CreateProjectData,
  token: string
): Promise<ApiResponse<Project>> {
  return apiCall("/api/projects/create", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Získaj všetky projekty používateľa
 */
export async function getUserProjects(
  userId: string,
  token: string
): Promise<ApiResponse<Project[]>> {
  return apiCall(`/api/projects/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Získaj konkrétny projekt
 */
export async function getProject(
  projectId: string,
  token: string
): Promise<ApiResponse<Project>> {
  return apiCall(`/api/projects/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Získaj konkrétny projekt info
 */
export async function getProjectInfo(
  projectId: string
): Promise<ApiResponse<Project>> {
  return apiCall(`/api/projects/${projectId}/info`);
}

/**
 * Aktualizuj projekt
 */
export async function updateProject(
  projectId: string,
  data: UpdateProjectData,
  token: string
): Promise<ApiResponse<Project>> {
  return apiCall(`/api/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Vymaž projekt
 */
export async function deleteProject(
  projectId: string,
  token: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall(`/api/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Nahraj obrázok do projektu
 */
export async function uploadProjectImage(
  projectId: string,
  file: File,
  token: string
): Promise<ApiResponse<{ filename: string; image_count: number }>> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const url = `${API_BASE_URL}/api/projects/${projectId}/upload-image`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.detail || data.message || "Upload failed",
      };
    }

    return { data };
  } catch (error) {
    console.error("Upload Error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Získaj všetky obrázky projektu
 */
export async function getProjectImages(
  projectId: string,
  token: string
): Promise<ApiResponse<{ images: string[] }>> {
  return apiCall(`/api/projects/${projectId}/images`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Vytvor URL na stiahnutie obrázka
 */
export function getProjectImageUrl(
  projectId: string,
  filename: string,
  token: string
): string {
  return `${API_BASE_URL}/api/projects/${projectId}/images/${filename}?token=${token}`;
}

// ============================================
// 3D MODEL ENDPOINTS
// ============================================

export interface Model3DInfo {
  exists: boolean;
  filename?: string;
  size?: number;
  url?: string;
}

/**
 * Skontroluj či existuje 3D model
 */
export async function check3DModel(
  projectId: string,
  token: string
): Promise<ApiResponse<Model3DInfo>> {
  return apiCall(`/api/projects/${projectId}/3d-model`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Získaj obsah 3D modelu
 */
export async function get3DModelContent(
  projectId: string,
  token: string
): Promise<ApiResponse<{ model_content: string; model_size: number }>> {
  return apiCall(`/api/projects/${projectId}/3d-model/content`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Vráť URL na 3D model content
 */
export function get3DModelUrl(
  projectId: string,
  token: string
): string {
  return `${API_BASE_URL}/api/projects/${projectId}/3d-model/content?token=${token}`;
}

// ============================================
// MEDIA ENDPOINTS (Videos + Models)
// ============================================

export interface MediaFile {
  filename: string;
  type: "video" | "model";
  size: number;
}

export interface ProjectMedia {
  videos: MediaFile[];
  models: MediaFile[];
  has_media: boolean;
  priority: "video" | "model" | null;
}

/**
 * Získaj všetky dostupné médiá (videá a PLY modely) pre projekt
 */
export async function getProjectMedia(
  projectId: string
): Promise<ApiResponse<ProjectMedia>> {
  return apiCall(`/api/projects/${projectId}/media`);
}

/**
 * Vráť URL na médiá súbor (video alebo model)
 */
export function getProjectMediaUrl(
  projectId: string,
  mediaType: "video" | "model",
  filename: string,
  token?: string
): string {
  const url = `${API_BASE_URL}/api/projects/${projectId}/media/${mediaType}/${filename}`;
  return token ? `${url}?token=${token}` : url;
}

/**
 * Vráť URL na video
 */
export function getVideoUrl(
  projectId: string,
  filename: string,
  token?: string
): string {
  return getProjectMediaUrl(projectId, "video", filename, token);
}

/**
 * Vráť URL na PLY model
 */
export function getModelUrl(
  projectId: string,
  filename: string,
  token?: string
): string {
  return getProjectMediaUrl(projectId, "model", filename, token);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Ulož token lokálne
 */
export async function saveAuthToken(token: string): Promise<void> {
  // Implementovať v Frontend pomocou AsyncStorage
  // import AsyncStorage from "@react-native-async-storage/async-storage";
  // await AsyncStorage.setItem("authToken", token);
}

/**
 * Vymaž token
 */
export async function clearAuthToken(): Promise<void> {
  // import AsyncStorage from "@react-native-async-storage/async-storage";
  // await AsyncStorage.removeItem("authToken");
}

/**
 * Načítaj token z úložiska
 */
export async function getAuthToken(): Promise<string | null> {
  // import AsyncStorage from "@react-native-async-storage/async-storage";
  // return await AsyncStorage.getItem("authToken");
  return null;
}
