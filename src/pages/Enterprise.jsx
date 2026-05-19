import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Container, Divider, FormControlLabel, Grid, Paper, Stack, Switch,
  Tab, Tabs, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  MenuItem, Alert, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/axiosInstance';
import { useSelector, useDispatch } from 'react-redux';
import { projectApi } from '../api/projectApi';
import { enterpriseApi } from '../api/enterpriseApi';
import { setCurrentRole, setCurrentPermissions } from '../features/auth/authSlice';

const tabProps = (index) => ({
  id: `enterprise-tab-${index}`,
  'aria-controls': `enterprise-tabpanel-${index}`
});

const Enterprise = () => {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const currentPermissions = useSelector((state) => state.auth.currentPermissions || []);

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', severity: 'success' });

  const [enterprise, setEnterprise] = useState({
    requireApprovalForCompletion: false,
    sla: { enabled: false, escalateHoursAfterDue: 24, repeatEscalationHours: 24 },
    integrations: { slackWebhookUrl: '', emailAlertsToAdmins: false }
  });

  const [auditRows, setAuditRows] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyLabel, setNewKeyLabel] = useState('Automation export');
  const [revealedKey, setRevealedKey] = useState('');

  // Workspace Settings State
  const [renameText, setRenameText] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Comment Dialog State
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeApproval, setActiveApproval] = useState({ id: null, type: null, title: '', requestType: 'completion' });

  const userId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);
  const roleForProject = useCallback((proj) => {
    if (!proj || !userId) return null;
    const uidStr = userId.toString();
    if (proj.ownerId && (proj.ownerId._id || proj.ownerId).toString() === uidStr) return 'admin';
    const m = proj.members?.find((mem) => (mem.userId?._id || mem.userId)?.toString() === uidStr);
    return m?.role || null;
  }, [userId]);

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await projectApi.getProjects();
      setProjects(data);
      if (!projectId && data.length > 0) {
        // Try to select a project where user is admin first
        const adminProject = data.find(p => roleForProject(p) === 'admin' || user?.systemRole === 'superadmin');
        setProjectId(adminProject ? adminProject._id : data[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [projectId, roleForProject, user?.systemRole]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const admin = useMemo(
    () => {
      if (user?.systemRole === 'superadmin') return true;
      if (!projectId) return false;
      const isOwnerOrAdmin = roleForProject(projects.find((p) => p._id === projectId)) === 'admin';
      return isOwnerOrAdmin || currentPermissions.includes('enterprise:manage');
    },
    [projectId, projects, roleForProject, user?.systemRole, currentPermissions]
  );

  useEffect(() => {
    const fetchPerms = async () => {
      if (projectId && projects.length > 0) {
        const p = projects.find((x) => x._id === projectId);
        if (p && userId) {
          const mem = p.members.find(m => String(m.userId?._id || m.userId) === String(userId));
          if (mem) {
            dispatch(setCurrentRole(mem.role));
          } else if (user?.systemRole === 'superadmin') {
            dispatch(setCurrentRole('admin'));
          }

          try {
            const { data } = await projectApi.getMyPermissions(projectId);
            dispatch(setCurrentPermissions(data.permissions));
          } catch (e) {
            console.error('Failed to fetch workspace permissions:', e);
          }
        }
      }
    };
    fetchPerms();
  }, [projectId, projects, userId, dispatch, user?.systemRole]);

  useEffect(() => {
    const p = projects.find((x) => x._id === projectId);
    if (!p?.enterprise) {
      setEnterprise({
        requireApprovalForCompletion: false,
        sla: { enabled: false, escalateHoursAfterDue: 24, repeatEscalationHours: 24 },
        integrations: { slackWebhookUrl: '', emailAlertsToAdmins: false }
      });
      return;
    }
    const ent = p.enterprise;
    setEnterprise({
      requireApprovalForCompletion: !!ent.requireApprovalForCompletion,
      sla: {
        enabled: !!ent.sla?.enabled,
        escalateHoursAfterDue: ent.sla?.escalateHoursAfterDue ?? 24,
        repeatEscalationHours: ent.sla?.repeatEscalationHours ?? 24
      },
      integrations: {
        slackWebhookUrl: ent.integrations?.slackWebhookUrl || '',
        emailAlertsToAdmins: !!ent.integrations?.emailAlertsToAdmins
      }
    });
    
    if (p) setRenameText(p.name);
  }, [projectId, projects]);

  const showMsg = useCallback((text, severity = 'success') => setMessage({ text, severity }), []);

  const broadcastTasksRefresh = useCallback((pid) => {
    const id = pid || projectId;
    const detail = { projectId: id, source: 'enterprise' };
    try {
      const bc = new BroadcastChannel('tm-tasks-sync');
      bc.postMessage({ type: 'tasks-changed', ...detail });
      bc.close();
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('tm-tasks-sync', { detail }));
  }, [projectId]);

  const saveEnterprise = useCallback(async () => {
    if (!projectId || !admin) return;
    setLoading(true);
    try {
      await projectApi.updateEnterprise(projectId, enterprise);
      showMsg('Enterprise settings saved.');
      fetchProjects();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Save failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, admin, enterprise, showMsg, fetchProjects]);

  const loadAudit = useCallback(async () => {
    if (!projectId || !admin) return;
    try {
      const { data } = await enterpriseApi.getAuditLog(projectId);
      setAuditRows(data.items || []);
    } catch (e) {
      showMsg(e.response?.data?.message || 'Could not load audit log', 'error');
    }
  }, [projectId, admin, showMsg]);

  const loadApprovals = useCallback(async () => {
    if (!projectId || !admin) return;
    try {
      const { data } = await enterpriseApi.getPendingApprovals(projectId);
      setApprovals(Array.isArray(data) ? data : []);
    } catch (e) {
      showMsg(e.response?.data?.message || 'Could not load approvals', 'error');
    }
  }, [projectId, admin, showMsg]);

  const loadApiKeys = useCallback(async () => {
    if (!projectId || !admin) return;
    try {
      const { data } = await projectApi.getApiKeys(projectId);
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (e) {
      showMsg(e.response?.data?.message || 'Could not load API keys', 'error');
    }
  }, [projectId, admin, showMsg]);

  useEffect(() => {
    if (tab === 1) loadAudit();
    if (tab === 2) loadApprovals();
    if (tab === 4) loadApiKeys();
  }, [tab, projectId, admin, loadAudit, loadApprovals, loadApiKeys]);

  useEffect(() => {
    if (!token || !projectId) return;

    const socketBaseUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketBaseUrl, {
      auth: { token },
      transports: ['polling']
    });

    socket.emit('project:join', { projectId });

    socket.on('task:changed', ({ projectId: pid }) => {
      if (pid === projectId) {
        if (tab === 1) loadAudit();
        if (tab === 2) loadApprovals();
      }
    });

    socket.on('project:updated', ({ projectId: pid }) => {
      if (pid === projectId) {
        fetchProjects();
      }
    });

    return () => {
      socket.emit('project:leave', { projectId });
      socket.disconnect();
    };
  }, [token, projectId, tab, loadAudit, loadApprovals, fetchProjects]);

  useEffect(() => {
    const handleTaskChange = (e) => {
      if (e.detail?.projectId === projectId) {
        if (tab === 1) loadAudit();
        if (tab === 2) loadApprovals();
      }
    };
    const handleProjectUpdate = (e) => {
      if (e.detail?.projectId === projectId) {
        fetchProjects();
      }
    };
    window.addEventListener('tm-socket-task-changed', handleTaskChange);
    window.addEventListener('tm-socket-project-updated', handleProjectUpdate);
    return () => {
      window.removeEventListener('tm-socket-task-changed', handleTaskChange);
      window.removeEventListener('tm-socket-project-updated', handleProjectUpdate);
    };
  }, [projectId, tab, loadAudit, loadApprovals, fetchProjects]);

  const handleConfirmApprovalAction = useCallback(async () => {
    if (!activeApproval.id) return;
    setLoading(true);
    try {
      if (activeApproval.type === 'approve') {
        await enterpriseApi.approveRequest(activeApproval.id, commentText);
        showMsg('Approved successfully.');
      } else {
        await enterpriseApi.rejectRequest(activeApproval.id, commentText);
        showMsg('Rejected successfully.');
      }
      setCommentDialogOpen(false);
      setCommentText('');
      broadcastTasksRefresh();
      loadApprovals();
    } catch (e) {
      showMsg(e.response?.data?.message || `${activeApproval.type === 'approve' ? 'Approve' : 'Reject'} failed`, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeApproval, commentText, showMsg, broadcastTasksRefresh, loadApprovals]);

  const openApproveDialog = (id, title, requestType) => {
    setActiveApproval({ id, type: 'approve', title, requestType });
    setCommentText('');
    setCommentDialogOpen(true);
  };

  const openRejectDialog = (id, title, requestType) => {
    setActiveApproval({ id, type: 'reject', title, requestType });
    setCommentText('');
    setCommentDialogOpen(true);
  };

  const createApiKey = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data } = await projectApi.createApiKey(projectId, newKeyLabel);
      setRevealedKey(data.key || '');
      showMsg(data.message || 'Key created.');
      loadApiKeys();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Key creation failed', 'error');
    }
  }, [projectId, newKeyLabel, showMsg, loadApiKeys]);

  const revokeKey = useCallback(async (kid) => {
    if (!window.confirm('Revoke this API key?')) return;
    try {
      await projectApi.revokeApiKey(projectId, kid);
      showMsg('Key revoked.');
      loadApiKeys();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Revoke failed', 'error');
    }
  }, [projectId, showMsg, loadApiKeys]);

  const downloadExport = useCallback(async (path, filename) => {
    if (!projectId) return;
    try {
      const res = await enterpriseApi.downloadExport(path, projectId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showMsg(`Downloaded ${filename}.`);
    } catch (e) {
      const msg = e.response?.data?.message;
      if (msg) showMsg(msg, 'error');
      else if (e.response?.data instanceof Blob) {
        const text = await e.response.data.text();
        try {
          const j = JSON.parse(text);
          showMsg(j.message || 'Export failed', 'error');
        } catch {
          showMsg('Export failed', 'error');
        }
      } else showMsg('Export failed', 'error');
    }
  }, [projectId, showMsg]);

  const testSlack = useCallback(async () => {
    try {
      await projectApi.testSlack(projectId);
      showMsg('Slack test sent.');
    } catch (e) {
      showMsg(e.response?.data?.message || 'Slack test failed', 'error');
    }
  }, [projectId, showMsg]);

  const testEmail = useCallback(async () => {
    try {
      const { data } = await projectApi.testEmail(projectId);
      showMsg(data.mocked ? 'Email logged (configure SMTP in server .env).' : 'Test email sent.');
    } catch (e) {
      showMsg(e.response?.data?.message || 'Email test failed', 'error');
    }
  }, [projectId, showMsg]);

  const handleRenameProject = async () => {
    if (!projectId || !admin || !renameText.trim()) return;
    setLoading(true);
    try {
      await projectApi.renameProject(projectId, renameText);
      showMsg('Workspace renamed.');
      fetchProjects();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Rename failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId || !admin) return;
    if (!window.confirm('Are you SURE you want to delete this workspace and ALL its tasks? This cannot be undone.')) return;
    setLoading(true);
    try {
      await projectApi.deleteProject(projectId);
      showMsg('Workspace deleted.');
      setProjectId('');
      fetchProjects();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (uid, newRole) => {
    try {
      await projectApi.updateMemberRole(projectId, uid, newRole);
      showMsg('Role updated.');
      fetchProjects();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handleRemoveMember = async (uid) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    try {
      await projectApi.removeMember(projectId, uid);
      showMsg('Member removed.');
      fetchProjects();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Remove failed', 'error');
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;
    setLoading(true);
    try {
      await projectApi.inviteMember(projectId, inviteEmail, inviteRole);
      showMsg('Member invited.');
      setInviteEmail('');
      fetchProjects();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Invite failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Enterprise</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Audit trail, SLA escalation, completion approvals, exports, API keys, Slack and email hooks.
      </Typography>

      {message.text && (
        <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage({ text: '' })}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Workspace"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
          {!admin && projectId && (
            <Chip label="Member Access — admin features locked" color="warning" variant="outlined" />
          )}
        </Grid>
      </Grid>

      {!admin && projectId ? (
        <Paper sx={{ p: 6, mt: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h5" color="error" sx={{ mb: 1, fontWeight: 700 }}>Access Denied</Typography>
          <Typography color="text.secondary">
            Enterprise settings and audit logs are only available to Workspace Admins. 
            You are currently a Member of this workspace. 
            Please select another workspace where you have Admin access.
          </Typography>
        </Paper>
      ) : (
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Policies & SLA" {...tabProps(0)} />
          <Tab label="Audit log" {...tabProps(1)} />
          <Tab label="Approvals" {...tabProps(2)} />
          <Tab label="Exports" {...tabProps(3)} />
          <Tab label="API keys" {...tabProps(4)} />
          <Tab label="Workspace" {...tabProps(5)} />
        </Tabs>
        <Divider />

        <Box role="tabpanel" hidden={tab !== 0} sx={{ p: 2 }}>
          {tab === 0 && (
            <Stack spacing={2}>
              <FormControlLabel
                control={(
                  <Switch
                    checked={enterprise.requireApprovalForCompletion}
                    onChange={(e) => setEnterprise((s) => ({ ...s, requireApprovalForCompletion: e.target.checked }))}
                    disabled={!admin}
                  />
                )}
                label="Require admin approval before a task can be marked Done"
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>SLA & escalation</Typography>
              <FormControlLabel
                control={(
                  <Switch
                    checked={enterprise.sla.enabled}
                    onChange={(e) => setEnterprise((s) => ({
                      ...s,
                      sla: { ...s.sla, enabled: e.target.checked }
                    }))}
                    disabled={!admin}
                  />
                )}
                label="Enable overdue SLA checks (hourly job notifies members & admins)"
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Escalate after hours past due"
                    value={enterprise.sla.escalateHoursAfterDue}
                    onChange={(e) => setEnterprise((s) => ({
                      ...s,
                      sla: { ...s.sla, escalateHoursAfterDue: Number(e.target.value) || 24 }
                    }))}
                    disabled={!admin}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Repeat escalation every (hours)"
                    value={enterprise.sla.repeatEscalationHours}
                    onChange={(e) => setEnterprise((s) => ({
                      ...s,
                      sla: { ...s.sla, repeatEscalationHours: Number(e.target.value) || 24 }
                    }))}
                    disabled={!admin}
                  />
                </Grid>
              </Grid>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Integrations</Typography>
              <TextField
                fullWidth
                label="Slack incoming webhook URL"
                value={enterprise.integrations.slackWebhookUrl}
                onChange={(e) => setEnterprise((s) => ({
                  ...s,
                  integrations: { ...s.integrations, slackWebhookUrl: e.target.value }
                }))}
                disabled={!admin}
                placeholder="https://hooks.slack.com/services/..."
              />
              <FormControlLabel
                control={(
                  <Switch
                    checked={enterprise.integrations.emailAlertsToAdmins}
                    onChange={(e) => setEnterprise((s) => ({
                      ...s,
                      integrations: { ...s.integrations, emailAlertsToAdmins: e.target.checked }
                    }))}
                    disabled={!admin}
                  />
                )}
                label="Email project admins on SLA escalations"
              />
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={testSlack} disabled={!admin || !projectId}>Test Slack</Button>
                <Button variant="outlined" onClick={testEmail} disabled={!admin || !projectId}>Test email to me</Button>
                <Button variant="contained" onClick={saveEnterprise} disabled={!admin || loading}>Save policies</Button>
              </Stack>
            </Stack>
          )}
        </Box>

        <Box role="tabpanel" hidden={tab !== 1} sx={{ p: 2 }}>
          {tab === 1 && admin && (
            <>
              <Button size="small" variant="outlined" onClick={loadAudit} sx={{ mb: 1 }}>Refresh</Button>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditRows.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{row.actorId?.email || row.actorId?.fullName || '—'}</TableCell>
                      <TableCell>{row.action}</TableCell>
                      <TableCell>{row.entityType} {row.entityId ? String(row.entityId).slice(-6) : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          {tab === 1 && !admin && <Typography color="text.secondary">Admins only.</Typography>}
        </Box>

        <Box role="tabpanel" hidden={tab !== 2} sx={{ p: 2 }}>
          {tab === 2 && admin && (
            <Stack spacing={2}>
              <Button size="small" variant="outlined" onClick={loadApprovals}>Refresh</Button>
              {approvals.length === 0 && <Typography color="text.secondary">No pending approvals.</Typography>}
              {approvals.map((a) => (
                <Paper key={a._id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <Typography fontWeight={700}>{a.taskId?.title || 'Task'}</Typography>
                    <Chip 
                      size="small" 
                      label={a.type === 'deletion' ? 'Deletion Request' : 'Completion Request'} 
                      color={a.type === 'deletion' ? 'error' : 'info'} 
                      variant="outlined" 
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Requested by {a.requestedBy?.fullName || a.requestedBy?.email}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" variant="contained" color="success" onClick={() => openApproveDialog(a._id, a.taskId?.title, a.type)}>Approve</Button>
                    <Button size="small" variant="outlined" color="warning" onClick={() => openRejectDialog(a._id, a.taskId?.title, a.type)}>Reject</Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
          {tab === 2 && !admin && <Typography color="text.secondary">Admins only.</Typography>}
        </Box>

        <Box role="tabpanel" hidden={tab !== 3} sx={{ p: 2 }}>
          {tab === 3 && projectId && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                CSV/PDF use your session token. For automation, create an API key (export scope) and call the same URLs with header <code>x-api-key</code> (tasks CSV and PDF only).
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Button variant="outlined" onClick={() => downloadExport('tasks.csv', `tasks-${projectId}.csv`)}>
                  Download tasks CSV
                </Button>
                {admin && (
                  <Button variant="outlined" onClick={() => downloadExport('audit.csv', `audit-${projectId}.csv`)}>
                    Download audit CSV
                  </Button>
                )}
                <Button variant="outlined" onClick={() => downloadExport('report.pdf', `report-${projectId}.pdf`)}>
                  Download PDF report
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Uses your session token. For scripts, use an API key and the same paths with header x-api-key.
              </Typography>
            </Stack>
          )}
        </Box>

        <Box role="tabpanel" hidden={tab !== 4} sx={{ p: 2 }}>
          {tab === 4 && admin && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <TextField
                  label="Label"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  size="small"
                />
                <Button variant="contained" onClick={createApiKey}>Create key</Button>
              </Stack>
              {revealedKey && (
                <Alert severity="warning" action={(
                  <IconButton size="small" onClick={() => { navigator.clipboard.writeText(revealedKey); showMsg('Copied to clipboard'); }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                )}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{revealedKey}</Typography>
                </Alert>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Prefix</TableCell>
                    <TableCell>Last used</TableCell>
                    <TableCell align="right">Revoke</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((k) => (
                    <TableRow key={k._id}>
                      <TableCell>{k.label}</TableCell>
                      <TableCell><code>{k.keyPrefix}…</code></TableCell>
                      <TableCell>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '—'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" onClick={() => revokeKey(k._id)}>Revoke</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          )}
          {tab === 4 && !admin && <Typography color="text.secondary">Admins only.</Typography>}
        </Box>

        <Box role="tabpanel" hidden={tab !== 5} sx={{ p: 2 }}>
          {tab === 5 && (
            <Stack spacing={4}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Rename Workspace</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField 
                    size="small" 
                    value={renameText} 
                    onChange={(e) => setRenameText(e.target.value)} 
                    disabled={!admin || loading}
                    sx={{ maxWidth: 300 }}
                  />
                  <Button variant="contained" onClick={handleRenameProject} disabled={!admin || loading}>Rename</Button>
                </Stack>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Members</Typography>
                {admin && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
                    <TextField 
                      size="small" 
                      placeholder="Email address" 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)} 
                    />
                    <TextField 
                      size="small" 
                      select 
                      value={inviteRole} 
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <MenuItem value="member">Member</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </TextField>
                    <Button variant="contained" onClick={handleInviteMember} disabled={loading || !inviteEmail}>Invite</Button>
                  </Stack>
                )}
                
                <Paper variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projects.find(p => p._id === projectId)?.members.map((m) => (
                        <TableRow key={m.userId?._id || m.userId}>
                          <TableCell>{m.userId?.fullName || 'Unknown'}</TableCell>
                          <TableCell>{m.userId?.email || '—'}</TableCell>
                          <TableCell>
                            {admin && String(projects.find(p => p._id === projectId)?.ownerId) !== String(m.userId?._id || m.userId) ? (
                              <TextField
                                select
                                size="small"
                                value={m.role}
                                onChange={(e) => handleUpdateRole(m.userId?._id || m.userId, e.target.value)}
                                sx={{ minWidth: 100 }}
                              >
                                <MenuItem value="member">Member</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                              </TextField>
                            ) : (
                              <Chip label={m.role} size="small" color={m.role === 'admin' ? 'primary' : 'default'} />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {admin && String(projects.find(p => p._id === projectId)?.ownerId) !== String(m.userId?._id || m.userId) && (
                              <Button size="small" color="error" onClick={() => handleRemoveMember(m.userId?._id || m.userId)}>Remove</Button>
                            )}
                            {String(projects.find(p => p._id === projectId)?.ownerId) === String(m.userId?._id || m.userId) && (
                              <Typography variant="caption" color="text.secondary">Owner</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>

              <Divider />
              
              {admin && (
                <Box>
                  <Typography variant="h6" color="error" sx={{ mb: 1 }}>Danger Zone</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Deleting a workspace will permanently remove all tasks, approvals, and logs associated with it.
                  </Typography>
                  <Button variant="contained" color="error" onClick={handleDeleteProject} disabled={loading}>
                    Delete Workspace
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </Paper>
      )}

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => !loading && setCommentDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {activeApproval.type === 'approve' ? `Approve ${activeApproval.requestType === 'deletion' ? 'Deletion' : 'Task'}` : `Reject ${activeApproval.requestType === 'deletion' ? 'Deletion' : 'Task'}`}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {activeApproval.type === 'approve'
              ? `Are you sure you want to approve ${activeApproval.requestType === 'deletion' ? 'the deletion of' : ''} "${activeApproval.title}"?`
              : `Are you sure you want to reject ${activeApproval.requestType === 'deletion' ? 'the deletion of' : ''} "${activeApproval.title}"?`}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment (Optional)"
            placeholder="Add a reason or feedback..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCommentDialogOpen(false)} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleConfirmApprovalAction}
            variant="contained"
            color={activeApproval.type === 'approve' ? 'success' : 'warning'}
            disabled={loading}
          >
            {loading ? 'Processing...' : (activeApproval.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Enterprise;
