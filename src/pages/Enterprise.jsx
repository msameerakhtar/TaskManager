import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Container, Divider, FormControlLabel, Grid, Paper, Stack, Switch,
  Tab, Tabs, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  MenuItem, Alert, Chip, IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from 'axios';
import { useSelector } from 'react-redux';
import API_BASE_URL from '../config/api';

const tabProps = (index) => ({
  id: `enterprise-tab-${index}`,
  'aria-controls': `enterprise-tabpanel-${index}`
});

const Enterprise = () => {
  const token = useSelector((state) => state.auth.token);
  const authHeaders = { headers: { 'x-auth-token': token } };

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

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/projects`, authHeaders);
      setProjects(data);
      if (!projectId && data[0]?._id) setProjectId(data[0]._id);
    } catch (e) {
      console.error(e);
    }
  }, [token, projectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const userId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);
  const roleForProject = useCallback((proj) => {
    if (!proj?.members || !userId) return null;
    const m = proj.members.find((mem) => (mem.userId?._id || mem.userId)?.toString() === userId.toString());
    return m?.role || null;
  }, [userId]);

  const admin = projectId ? roleForProject(projects.find((p) => p._id === projectId)) === 'admin' : false;

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
  }, [projectId, projects]);

  const showMsg = (text, severity = 'success') => setMessage({ text, severity });

  /** Same-tab + other tabs: TaskList listens and refetches when approvals change. */
  const broadcastTasksRefresh = (pid) => {
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
  };

  const saveEnterprise = async () => {
    if (!projectId || !admin) return;
    setLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/projects/${projectId}/enterprise`, { enterprise }, authHeaders);
      showMsg('Enterprise settings saved.');
      fetchProjects();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Save failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAudit = async () => {
    if (!projectId || !admin) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/enterprise/audit?projectId=${projectId}&limit=100`, authHeaders);
      setAuditRows(data.items || []);
    } catch (e) {
      showMsg(e.response?.data?.message || 'Could not load audit log', 'error');
    }
  };

  const loadApprovals = async () => {
    if (!projectId || !admin) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/enterprise/approvals/pending?projectId=${projectId}`, authHeaders);
      setApprovals(Array.isArray(data) ? data : []);
    } catch (e) {
      showMsg(e.response?.data?.message || 'Could not load approvals', 'error');
    }
  };

  const loadApiKeys = async () => {
    if (!projectId || !admin) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/projects/${projectId}/api-keys`, authHeaders);
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (e) {
      showMsg(e.response?.data?.message || 'Could not load API keys', 'error');
    }
  };

  useEffect(() => {
    if (tab === 1) loadAudit();
    if (tab === 2) loadApprovals();
    if (tab === 4) loadApiKeys();
  }, [tab, projectId, admin]);

  const approveRequest = async (id) => {
    try {
      await axios.post(`${API_BASE_URL}/enterprise/approvals/${id}/approve`, {}, authHeaders);
      showMsg('Approved.');
      broadcastTasksRefresh();
      loadApprovals();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Approve failed', 'error');
    }
  };

  const rejectRequest = async (id) => {
    const comment = window.prompt('Optional comment for rejection', '') ?? '';
    try {
      await axios.post(`${API_BASE_URL}/enterprise/approvals/${id}/reject`, { comment }, authHeaders);
      showMsg('Rejected.');
      broadcastTasksRefresh();
      loadApprovals();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Reject failed', 'error');
    }
  };

  const createApiKey = async () => {
    if (!projectId) return;
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/api-keys`,
        { label: newKeyLabel },
        authHeaders
      );
      setRevealedKey(data.key || '');
      showMsg(data.message || 'Key created.');
      loadApiKeys();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Key creation failed', 'error');
    }
  };

  const revokeKey = async (kid) => {
    if (!window.confirm('Revoke this API key?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/projects/${projectId}/api-keys/${kid}`, authHeaders);
      showMsg('Key revoked.');
      loadApiKeys();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Revoke failed', 'error');
    }
  };

  const downloadExport = async (path, filename) => {
    if (!projectId) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/enterprise/exports/${path}?projectId=${projectId}`,
        { headers: { 'x-auth-token': token }, responseType: 'blob' }
      );
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
  };

  const testSlack = async () => {
    try {
      await axios.post(`${API_BASE_URL}/projects/${projectId}/integrations/test-slack`, {}, authHeaders);
      showMsg('Slack test sent.');
    } catch (e) {
      showMsg(e.response?.data?.message || 'Slack test failed', 'error');
    }
  };

  const testEmail = async () => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/projects/${projectId}/integrations/test-email`, {}, authHeaders);
      showMsg(data.mocked ? 'Email logged (configure SMTP in server .env).' : 'Test email sent.');
    } catch (e) {
      showMsg(e.response?.data?.message || 'Email test failed', 'error');
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
            <Chip label="View only — admin features locked" color="warning" variant="outlined" />
          )}
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Policies & SLA" {...tabProps(0)} />
          <Tab label="Audit log" {...tabProps(1)} />
          <Tab label="Approvals" {...tabProps(2)} />
          <Tab label="Exports" {...tabProps(3)} />
          <Tab label="API keys" {...tabProps(4)} />
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
                label="Email project admins on SLA escalations (needs SMTP_* in server env)"
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
                  <Typography fontWeight={700}>{a.taskId?.title || 'Task'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requested by {a.requestedBy?.fullName || a.requestedBy?.email}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" variant="contained" color="success" onClick={() => approveRequest(a._id)}>Approve</Button>
                    <Button size="small" variant="outlined" color="warning" onClick={() => rejectRequest(a._id)}>Reject</Button>
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
      </Paper>
    </Container>
  );
};

export default Enterprise;
