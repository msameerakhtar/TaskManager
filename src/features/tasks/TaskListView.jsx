import React, { useState } from 'react';
import {
  Box, Typography, Stack, Chip, Avatar, IconButton, Paper,
  Collapse, Divider, useTheme, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CustomLoader from '../../components/CustomLoader';
import DeleteTask from './DeleteTask';

const STATUS_CONFIG = {
  todo:        { label: 'Todo',        color: 'info',    bg: 'rgba(2,136,209,0.08)',   dot: '#0288d1' },
  in_progress: { label: 'In Progress', color: 'warning', bg: 'rgba(237,108,2,0.08)',   dot: '#ed6c02' },
  done:        { label: 'Done',        color: 'success', bg: 'rgba(46,125,50,0.08)',   dot: '#2e7d32' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'success' },
  medium: { label: 'Medium', color: 'warning' },
  high:   { label: 'High',   color: 'error'   },
};

const STATUS_ORDER = ['todo', 'in_progress', 'done'];

const GroupHeader = ({ config, count, expanded, onToggle }) => {
  const theme = useTheme();
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.2,
        borderRadius: '12px',
        bgcolor: config.bg,
        cursor: 'pointer',
        userSelect: 'none',
        border: '1px solid',
        borderColor: `${config.dot}33`,
        '&:hover': { opacity: 0.85 },
        transition: 'opacity 0.15s',
      }}
    >
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: config.dot, flexShrink: 0 }} />
      <Typography fontWeight={800} fontSize="0.9rem" color="text.primary">{config.label}</Typography>
      <Chip
        label={count}
        size="small"
        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, bgcolor: `${config.dot}22`, color: config.dot }}
      />
      <Box sx={{ ml: 'auto', color: 'text.secondary', display: 'flex' }}>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>
    </Box>
  );
};

const ListRow = React.memo(({
  task, movingTaskId, highlightedTaskId, onEditClick, onMarkDone, onDeleteSuccess, isDark
}) => {
  const theme = useTheme();
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const now = new Date();
  const overdue = task.status !== 'done' && task.dueDate && new Date(task.dueDate) < now;

  return (
    <>
      <Box
        id={`task-card-${task.id}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1.2,
          gap: 1.5,
          opacity: movingTaskId === task.id ? 0.5 : 1,
          bgcolor: highlightedTaskId === task.id
            ? `${theme.palette.primary.main}12`
            : 'transparent',
          outline: highlightedTaskId === task.id
            ? `2px solid ${theme.palette.primary.main}`
            : 'none',
          outlineOffset: '-2px',
          borderRadius: '8px',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)' },
        }}
      >
        {/* Priority dot */}
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            bgcolor: `${priorityCfg.color}.main`,
          }}
        />

        {/* Title + description */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            color={overdue ? 'error.main' : 'text.primary'}
            noWrap
          >
            {task.title || task.task || 'Untitled Task'}
          </Typography>
          {task.description && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {task.description}
            </Typography>
          )}
        </Box>

        {/* Chips row */}
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          {overdue && <Chip label="Overdue" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />}
          {task.approvalStatus === 'pending' && <Chip label="Pending" size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem' }} />}
          <Chip
            label={priorityCfg.label}
            color={priorityCfg.color}
            variant="outlined"
            size="small"
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
          />
        </Stack>

        {/* Due date */}
        <Typography
          variant="caption"
          fontWeight={600}
          color={overdue ? 'error.main' : 'text.secondary'}
          sx={{ flexShrink: 0, minWidth: 70, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}
        >
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : '—'}
        </Typography>

        {/* Assignee */}
        {task.assigneeId ? (
          <Tooltip title={task.assigneeId.fullName || 'Assignee'}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.main', fontWeight: 'bold', flexShrink: 0 }}>
              {task.assigneeId.fullName?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
          </Tooltip>
        ) : (
          <Box sx={{ width: 24, flexShrink: 0 }} />
        )}

        {/* Actions */}
        <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
          {task.status !== 'done' && (
            <Tooltip title="Mark Complete">
              <IconButton
                size="small"
                onClick={() => onMarkDone(task)}
                disabled={movingTaskId === task.id}
                sx={{ color: 'success.main', bgcolor: 'success.main' + '1A', '&:hover': { bgcolor: 'success.main' + '33' }, width: 26, height: 26 }}
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => onEditClick(task)}
              disabled={movingTaskId === task.id}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.main' + '1A' }, width: 26, height: 26 }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          {movingTaskId === task.id ? (
            <IconButton size="small" disabled sx={{ width: 26, height: 26 }}><CustomLoader size={13} /></IconButton>
          ) : (
            <DeleteTask taskId={task.id} onDeleteSuccess={onDeleteSuccess} />
          )}
        </Stack>
      </Box>
      <Divider sx={{ mx: 2, opacity: 0.5 }} />
    </>
  );
});

ListRow.displayName = 'ListRow';

const TaskListView = React.memo(({
  tasks,
  movingTaskId,
  highlightedTaskId,
  onEditClick,
  onMarkDone,
  onDeleteSuccess,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState({ todo: true, in_progress: true, done: true });

  const grouped = STATUS_ORDER.map((key) => ({
    key,
    config: STATUS_CONFIG[key],
    tasks: tasks.filter((t) => t.status === key),
  }));

  return (
    <Stack spacing={2}>
      {grouped.map(({ key, config, tasks: groupTasks }) => (
        <Paper
          key={key}
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <GroupHeader
            config={config}
            count={groupTasks.length}
            expanded={expanded[key]}
            onToggle={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
          />
          <Collapse in={expanded[key]}>
            <Box sx={{ pt: 0.5, pb: 0.5 }}>
              {groupTasks.length === 0 ? (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ display: 'block', textAlign: 'center', py: 2 }}
                >
                  No tasks in this column.
                </Typography>
              ) : (
                groupTasks.map((task) => (
                  <ListRow
                    key={task.id}
                    task={task}
                    movingTaskId={movingTaskId}
                    highlightedTaskId={highlightedTaskId}
                    onEditClick={onEditClick}
                    onMarkDone={onMarkDone}
                    onDeleteSuccess={onDeleteSuccess}
                    isDark={isDark}
                  />
                ))
              )}
            </Box>
          </Collapse>
        </Paper>
      ))}
    </Stack>
  );
});

TaskListView.displayName = 'TaskListView';
export default TaskListView;
