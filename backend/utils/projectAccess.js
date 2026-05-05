/**
 * Normalize member.userId whether it's an ObjectId, populated User doc, or plain object.
 */
const memberUserIdString = (m) => {
    const uid = m?.userId;
    if (uid == null) return '';
    if (typeof uid === 'object' && uid._id != null) return String(uid._id);
    return String(uid);
};

/**
 * True if user is project owner or listed in members (handles populated userId).
 */
const isProjectMember = (project, userId) => {
    if (!project || userId == null || userId === '') return false;
    const uid = String(userId);
    if (project.ownerId != null && String(project.ownerId) === uid) return true;
    if (!Array.isArray(project.members)) return false;
    return project.members.some((m) => memberUserIdString(m) === uid);
};

module.exports = { isProjectMember, memberUserIdString };
