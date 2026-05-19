/**
 * WorkspaceEnterpriseDialog
 *
 * Allows a Super Admin to view and override enterprise settings
 * for any workspace — inline in the Super Admin Dashboard.
 * Tabs: General | SLA | Integrations | Exports
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Tab, Tabs, Box, Typography, Switch,
    FormControlLabel, TextField, Divider, CircularProgress,
    Alert, Chip, useTheme
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../../api/axiosInstance';

const TabPanel = ({ children, value, index }) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
        {value === index && children}
    </Box>
);

const WorkspaceEnterpriseDialog = ({ open, onClose, workspaceId, workspaceName }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [requireApproval, setRequireApproval] = useState(false);
    const [slaEnabled, setSlaEnabled] = useState(false);
    const [escalateHours, setEscalateHours] = useState(24);
    const [repeatHours, setRepeatHours] = useState(24);
    const [slackUrl, setSlackUrl] = useState('');
    const [emailAlerts, setEmailAlerts] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!workspaceId || !open) return;
        setLoading(true);
        setError('');
        setSaveSuccess(false);
        try {
            const res = await api.get(`/admin/workspaces/${workspaceId}/enterprise`);
            const e = res.data.enterprise || {};
            setRequireApproval(e.requireApprovalForCompletion ?? false);
            setSlaEnabled(e.sla?.enabled ?? false);
            setEscalateHours(e.sla?.escalateHoursAfterDue ?? 24);
            setRepeatHours(e.sla?.repeatEscalationHours ?? 24);
            setSlackUrl(e.integrations?.slackWebhookUrl ?? '');
            setEmailAlerts(e.integrations?.emailAlertsToAdmins ?? false);
        } catch (err) {
            setError('Failed to load settings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [workspaceId, open]);

    useEffect(() => {
        if (open) {
            setTab(0);
            fetchSettings();
        }
    }, [open, fetchSettings]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaveSuccess(false);
        try {
            await api.patch(`/admin/workspaces/${workspaceId}/enterprise`, {
                enterprise: {
                    requireApprovalForCompletion: requireApproval,
                    sla: {
                        enabled: slaEnabled,
                        escalateHoursAfterDue: Number(escalateHours),
                        repeatEscalationHours: Number(repeatHours),
                    },
                    integrations: {
                        slackWebhookUrl: slackUrl.trim(),
                        emailAlertsToAdmins: emailAlerts,
                    }
                }
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async (endpoint, filename) => {
        setError('');
        try {
            const res = await api.get(`/enterprise/exports/${endpoint}`, {
                params: { projectId: workspaceId },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${filename}-${workspaceName.replace(/\s+/g, '-').toLowerCase()}.${endpoint.split('.')[1]}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download the requested report.');
        }
    };

    const sectionTitle = (text) => (
        <Typography variant="caption" sx={{
            display: 'block', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 1, color: 'text.secondary', mb: 1.5
        }}>
            {text}
        </Typography>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    backgroundImage: 'none',
                    border: `1px solid ${theme.palette.divider}`,
                }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SettingsIcon color="primary" />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Workspace Settings & Exports
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {workspaceName}
                        </Typography>
                    </Box>
                    <Chip
                        label="Super Admin Override"
                        size="small"
                        color="secondary"
                        sx={{ ml: 'auto', fontWeight: 600, fontSize: '0.7rem' }}
                    />
                </Box>

                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ mt: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
                >
                    <Tab label="General" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label="SLA Rules" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label="Integrations" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label="Exports" sx={{ textTransform: 'none', fontWeight: 600 }} />
                </Tabs>
            </DialogTitle>

            <DialogContent sx={{ pt: 0, minHeight: 260 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
                        {saveSuccess && (
                            <Alert
                                severity="success"
                                icon={<CheckCircleIcon />}
                                sx={{ mt: 2, borderRadius: 2 }}
                            >
                                Settings saved successfully!
                            </Alert>
                        )}

                        {/* ── Tab 0: General ───────────────────────────────── */}
                        <TabPanel value={tab} index={0}>
                            {sectionTitle('Approval Workflow')}
                            <Box sx={{
                                p: 2.5, borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                mb: 2
                            }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={requireApproval}
                                            onChange={e => setRequireApproval(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                Require Approval for Task Completion
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Members must get admin sign-off before marking tasks as done.
                                            </Typography>
                                        </Box>
                                    }
                                    labelPlacement="start"
                                    sx={{ mx: 0, width: '100%', justifyContent: 'space-between' }}
                                />
                            </Box>
                        </TabPanel>

                        {/* ── Tab 1: SLA ───────────────────────────────────── */}
                        <TabPanel value={tab} index={1}>
                            {sectionTitle('SLA Escalation Rules')}
                            <Box sx={{
                                p: 2.5, borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                mb: 2
                            }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={slaEnabled}
                                            onChange={e => setSlaEnabled(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>Enable SLA Monitoring</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Automatically escalate overdue tasks to workspace admins.
                                            </Typography>
                                        </Box>
                                    }
                                    labelPlacement="start"
                                    sx={{ mx: 0, width: '100%', justifyContent: 'space-between' }}
                                />
                            </Box>

                            <Box sx={{
                                display: 'flex', gap: 2,
                                opacity: slaEnabled ? 1 : 0.45,
                                pointerEvents: slaEnabled ? 'auto' : 'none',
                                transition: 'opacity 0.2s'
                            }}>
                                <TextField
                                    label="Escalate after (hours)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={escalateHours}
                                    onChange={e => setEscalateHours(Math.max(1, Math.min(720, Number(e.target.value))))}
                                    inputProps={{ min: 1, max: 720 }}
                                    helperText="Hours past due date before first alert"
                                />
                                <TextField
                                    label="Repeat every (hours)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={repeatHours}
                                    onChange={e => setRepeatHours(Math.max(1, Math.min(720, Number(e.target.value))))}
                                    inputProps={{ min: 1, max: 720 }}
                                    helperText="Interval between repeat escalations"
                                />
                            </Box>
                        </TabPanel>

                        {/* ── Tab 2: Integrations ──────────────────────────── */}
                        <TabPanel value={tab} index={2}>
                            {sectionTitle('Notifications & Webhooks')}
                            <Box sx={{
                                p: 2.5, borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                mb: 2
                            }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={emailAlerts}
                                            onChange={e => setEmailAlerts(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>Email Alerts to Admins</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Send email notifications to workspace admins for SLA breaches.
                                            </Typography>
                                        </Box>
                                    }
                                    labelPlacement="start"
                                    sx={{ mx: 0, width: '100%', justifyContent: 'space-between' }}
                                />
                            </Box>

                            <Divider sx={{ my: 2 }} />
                            {sectionTitle('Slack Integration')}
                            <TextField
                                label="Slack Webhook URL"
                                fullWidth
                                size="small"
                                value={slackUrl}
                                onChange={e => setSlackUrl(e.target.value)}
                                placeholder="https://hooks.slack.com/services/..."
                                helperText="Workspace will post task alerts to this Slack channel."
                            />
                        </TabPanel>

                        {/* ── Tab 3: Exports ───────────────────────────────── */}
                        <TabPanel value={tab} index={3}>
                            {sectionTitle('CSV / PDF Exports')}
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Use your Super Admin credentials to export data from this workspace.
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleDownload('tasks.csv', 'tasks')}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        py: 1.5,
                                        px: 2.5,
                                        borderRadius: 2.5,
                                        borderColor: 'divider',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'primary.light',
                                            color: 'primary.main'
                                        }
                                    }}
                                >
                                    Download Tasks CSV
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleDownload('audit.csv', 'audit')}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        py: 1.5,
                                        px: 2.5,
                                        borderRadius: 2.5,
                                        borderColor: 'divider',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'primary.light',
                                            color: 'primary.main'
                                        }
                                    }}
                                >
                                    Download Audit CSV
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleDownload('report.pdf', 'report')}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        py: 1.5,
                                        px: 2.5,
                                        borderRadius: 2.5,
                                        borderColor: 'divider',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'primary.light',
                                            color: 'primary.main'
                                        }
                                    }}
                                >
                                    Download PDF Report
                                </Button>
                            </Box>
                        </TabPanel>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                    Close
                </Button>
                {tab !== 3 && (
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving || loading}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            borderRadius: 2,
                            background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                            '&:hover': { opacity: 0.9 }
                        }}
                    >
                        {saving ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : null}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default WorkspaceEnterpriseDialog;
