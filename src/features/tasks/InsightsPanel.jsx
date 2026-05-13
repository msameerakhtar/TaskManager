import React from 'react';
import {
  Paper, Typography, Box, Grid, Stack, Button, Chip, Alert
} from '@mui/material';
import CustomLoader from '../../components/CustomLoader';

/**
 * Displays productivity insights, calendar sync links, and team workload data.
 */
const InsightsPanel = React.memo(({
  insights,
  calendarLinks,
  workloadData,
  workloadReady,
  workloadError,
  selectedProject,
  isDark
}) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Stack spacing={3}>
          {insights?.summary && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Productivity Insights</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px' }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">{insights.summary.avgCompletionHours}h</Typography>
                    <Typography variant="caption" color="text.secondary">Avg. Completion</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px' }}>
                    <Typography variant="h5" fontWeight="bold" color="success.main">{insights.summary.completedTasks}</Typography>
                    <Typography variant="caption" color="text.secondary">Tasks Done</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px' }}>
                    <Typography variant="h5" fontWeight="bold" color="error.main">{insights.summary.overdueTasks}</Typography>
                    <Typography variant="caption" color="text.secondary">Overdue</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
          
          {calendarLinks && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Calendar Sync</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" color="primary" href={calendarLinks.googleCalendarUrl} target="_blank" sx={{ borderRadius: '8px', textTransform: 'none' }}>Sync Google</Button>
                <Button variant="outlined" href={calendarLinks.outlookCalendarUrl} target="_blank" sx={{ borderRadius: '8px', textTransform: 'none' }}>Sync Outlook</Button>
                <Button variant="outlined" href={calendarLinks.icsUrl} target="_blank" sx={{ borderRadius: '8px', textTransform: 'none' }}>Download ICS</Button>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        {selectedProject && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Team Workload</Typography>
            {!workloadReady ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CustomLoader size={30} /></Box>
            ) : workloadError ? (
              <Alert severity="warning">{workloadError}</Alert>
            ) : workloadData.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No workload data available. Invite members and assign tasks.</Typography>
            ) : (
              <Stack spacing={2}>
                {workloadData.map((member, idx) => (
                  <Box key={idx} sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">{member.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{member.role}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label={`${member.activeTasks} tasks`} sx={{ bgcolor: 'background.paper' }} />
                      <Chip size="small" label={`${member.estimatedHours} hrs`} sx={{ bgcolor: 'background.paper' }} />
                      {member.overloaded && <Chip size="small" color="error" label="Overloaded" />}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        )}
      </Grid>
    </Grid>
  );
});

InsightsPanel.displayName = 'InsightsPanel';

export default InsightsPanel;
