import { apiRequest } from "../../lib/api";

export async function changeMyAppPassword(payload: {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<{ success: boolean; forcePasswordChange: boolean }>("/user/me/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
