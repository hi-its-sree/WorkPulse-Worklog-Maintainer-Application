// The one shape a user is returned in. Every route must use it: the client stores
// this object and drives routing off `securityQuestionsConfigured`, so a response
// that omits a field silently changes what the app believes about the user.
export const buildUserResponse = (user) => ({
  id: user.id,
  fullName: user.fullName,
  employeeId: user.employeeId,
  email: user.email,
  department: user.department,
  jobTitle: user.jobTitle,
  phone: user.phone,
  location: user.location,
  manager: user.manager,
  role: user.role,
  status: user.status,
  accessLevel: user.accessLevel,
  visibility: user.visibility,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
  securityQuestionsConfigured: !!(
    user.securityAnswerPetName &&
    user.securityAnswerChildhoodNickname &&
    user.securityAnswerBirthplace &&
    user.securityAnswerFavoritePlace &&
    user.securityAnswerFavoriteMovie
  ),
});

export default buildUserResponse;
