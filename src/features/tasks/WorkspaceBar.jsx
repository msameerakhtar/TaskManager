import React from 'react';
import {
  Paper, Typography, Box, Grid, Stack, Button, Chip, TextField, MenuItem, Avatar
} from '@mui/material';

/**
 * Workspace management bar — project selector, create workspace, invite member.
 */
const WorkspaceBar = React.memo(({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  selectedProject,
  onlineCount,
  isAdmin,
  newProjectName,
  setNewProjectName,
  handleCreateProject,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  handleInviteMember,
  isDark
}) => {
  return (
    <Paper sx={{ p: 2.5, mb: 4, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'background.paper' : '#f8fafc' }} elevation={0}>
      <Grid container spacing={3} alignItems="center">
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'text.secondary' }}>Current Workspace</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select fullWidth size="small"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((project) => (
                <MenuItem key={project._id} value={project._id}>{project.name}</MenuItem>
              ))}
            </TextField>
            {selectedProject && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 80 }}>
                <Avatar sx={{ width: 10, height: 10, bgcolor: onlineCount > 0 ? 'success.main' : 'grey.500' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {onlineCount} online
                </Typography>
              </Stack>
            )}
          </Stack>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }} sx={{ opacity: isAdmin ? 1 : 0.5, pointerEvents: isAdmin ? 'auto' : 'none' }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', color: 'text.secondary' }}>Create New Workspace</Typography>
            {!isAdmin && <Chip label="Admin Only" size="small" variant="outlined" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField fullWidth size="small" placeholder="Workspace Name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} disabled={!isAdmin} />
            <Button variant="outlined" onClick={handleCreateProject} sx={{ minWidth: '90px' }} disabled={!isAdmin}>Create</Button>
          </Stack>
        </Grid>

        {selectedProject && (
          <Grid size={{ xs: 12, md: 5 }} sx={{ opacity: isAdmin ? 1 : 0.5, pointerEvents: isAdmin ? 'auto' : 'none' }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', color: 'text.secondary' }}>
                Invite to Workspace (Team Size: {selectedProject.members?.length || 0})
              </Typography>
              {!isAdmin && <Chip label="Admin Only" size="small" variant="outlined" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField fullWidth size="small" placeholder="Enter email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} disabled={!isAdmin} />
              <TextField select size="small" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} sx={{ minWidth: '130px' }} disabled={!isAdmin}>
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
              <Button variant="contained" color="primary" onClick={handleInviteMember} sx={{ minWidth: '100px', boxShadow: 'none' }} disabled={!isAdmin}>Invite</Button>
            </Stack>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
});

WorkspaceBar.displayName = 'WorkspaceBar';

export default WorkspaceBar;
