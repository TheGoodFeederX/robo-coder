/** Only the first account may be created: one teacher per deployment. */
export function canCreateTeacher(existingUsers: number): { allowed: boolean; message?: string } {
  if (existingUsers > 0) {
    return { allowed: false, message: "Akaun guru sudah wujud. Sila log masuk." }
  }
  return { allowed: true }
}

export function validateTeacherCredentials(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Emel tidak sah."
  if (password.length < 8) return "Kata laluan mesti sekurang-kurangnya 8 aksara."
  return null
}
