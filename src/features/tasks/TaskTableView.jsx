import React, { useMemo, useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Chip, Avatar, IconButton, Typography, useTheme, Tooltip, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import LockIcon from '@mui/icons-material/Lock';
import CustomLoader from '../../components/CustomLoader';
import DeleteTask from './DeleteTask';

const STATUS_CONFIG = {
  todo:        { label: 'Todo',        color: 'info'    },
  in_progress: { label: 'In Progress', color: 'warning' },
  done:        { label: 'Done',        color: 'success' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'success' },
  medium: { label: 'Medium', color: 'warning' },
  high:   { label: 'High',   color: 'error'   },
};

const COLUMNS = [
  { id: 'title',     label: 'Task',       sortable: true,  width: '30%' },
  { id: 'status',    label: 'Status',     sortable: true,  width: '11%' },
  { id: 'priority',  label: 'Priority',   sortable: true,  width: '10%' },
  { id: 'assignee',  label: 'Assignee',   sortable: false, width: '14%' },
  { id: 'dueDate',   label: 'Due Date',   sortable: true,  width: '12%' },
  { id: 'created',   label: 'Created',    sortable: true,  width: '12%' },
  { id: 'actions',   label: '',           sortable: false, width: '11%' },
];

const TaskTableView = React.memo(({
  tasks,
  movingTaskId,
  highlightedTaskId,
  onEditClick,
  onMarkDone,
  onDeleteSuccess,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [orderBy, setOrderBy] = useState('dueDate');
  const [order, setOrder] = useState('asc');

  const handleSort = (col) => {
    if (orderBy === col) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(col);
      setOrder('asc');
    }
  };

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let valA, valB;
      switch (orderBy) {
        case 'title':    valA = (a.title || '').toLowerCase(); valB = (b.title || '').toLowerCase(); break;
        case 'status':   valA = a.status || ''; valB = b.status || ''; break;
        case 'priority': {
          const order = { high: 0, medium: 1, low: 2 };
          valA = order[a.priority] ?? 1; valB = order[b.priority] ?? 1; break;
        }
        case 'dueDate':  valA = new Date(a.dueDate || 0); valB = new Date(b.dueDate || 0); break;
        case 'created':  valA = new Date(a.createdAt || 0); valB = new Date(b.createdAt || 0); break;
        default:         valA = ''; valB = '';
      }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, orderBy, order]);

  const now = new Date();
  const isOverdue = (task) =>
    task.status !== 'done' && task.dueDate && new Date(task.dueDate) < now;

  return (
    <TableContainer
      component={Box}
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Table stickyHeader size="small">
        {/* ─── Header ─────────────────────────────── */}
        <TableHead>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableCell
                key={col.id}
                width={col.width}
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'text.secondary',
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  py: 1.5,
                  px: 2,
                }}
              >
                {col.sortable ? (
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : 'asc'}
                    onClick={() => handleSort(col.id)}
                    sx={{
                      '& .MuiTableSortLabel-icon': { opacity: 0.5 },
                      '&.Mui-active': { color: 'primary.main' },
                      '&.Mui-active .MuiTableSortLabel-icon': { opacity: 1, color: 'primary.main' },
                    }}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* ─── Body ───────────────────────────────── */}
        <TableBody>
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                No tasks found in your workspace.
              </TableCell>
            </TableRow>
          )}
          {sorted.map((task) => {
            const isHighlighted = highlightedTaskId === task.id;
            const overdue = isOverdue(task);
            const isBlocked = task.blockedBy && task.blockedBy.some(t => t.status !== 'done');
            const statusCfg  = STATUS_CONFIG[task.status]  || STATUS_CONFIG.todo;
            const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
            const dueDateStr = task.dueDate
              ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : '—';
            const createdStr = task.createdAt
              ? new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : '—';

            return (
              <TableRow
                key={task.id}
                id={`task-card-${task.id}`}
                sx={{
                  opacity: movingTaskId === task.id ? 0.5 : 1,
                  transition: 'all 0.2s',
                  bgcolor: isHighlighted
                    ? `${theme.palette.primary.main}14`
                    : 'transparent',
                  outline: isHighlighted ? `2px solid ${theme.palette.primary.main}` : 'none',
                  outlineOffset: '-2px',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  },
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                {/* Title */}
                <TableCell sx={{ px: 2, py: 1.5 }}>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={overdue ? 'error.main' : 'text.primary'}
                      sx={{ lineHeight: 1.3 }}
                    >
                      {task.title || task.task || 'Untitled Task'}
                      {overdue && (
                        <Chip
                          label="Overdue"
                          size="small"
                          color="error"
                          sx={{ ml: 1, height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                        />
                      )}
                    </Typography>
                    {task.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {task.description}
                      </Typography>
                    )}
                    {/* Extra chips */}
                    <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
                      {task.labels && task.labels.length > 0 && task.labels.map((label, idx) => (
                        <Chip 
                          key={idx} 
                          size="small" 
                          label={label.text} 
                          sx={{ 
                            height: 16, 
                            fontSize: '0.6rem', 
                            fontWeight: 700, 
                            bgcolor: label.color + '1A', 
                            color: label.color,
                            border: `1px solid ${label.color}40`
                          }} 
                        />
                      ))}
                      {task.approvalStatus === 'pending' && (
                        <Chip size="small" color="warning" label="Approval pending" sx={{ height: 16, fontSize: '0.6rem' }} />
                      )}
                      {task.escalationLevel > 0 && (
                        <Chip size="small" color="error" variant="outlined" label={`SLA L${task.escalationLevel}`} sx={{ height: 16, fontSize: '0.6rem' }} />
                      )}
                      {isBlocked && (
                        <Chip size="small" icon={<LockIcon sx={{ fontSize: '10px !important', ml: '4px' }} />} label="Blocked" color="error" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, '& .MuiChip-icon': { color: 'inherit' } }} />
                      )}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <Chip 
                          size="small" 
                          icon={<LibraryAddCheckIcon sx={{ fontSize: '10px !important', ml: '4px' }} />} 
                          label={`${task.subtasks.filter(s => s.isCompleted).length}/${task.subtasks.length}`} 
                          sx={{ 
                            height: 16, 
                            fontSize: '0.6rem', 
                            fontWeight: 700, 
                            bgcolor: task.subtasks.every(s => s.isCompleted) ? 'success.main' : 'action.selected', 
                            color: task.subtasks.every(s => s.isCompleted) ? 'white' : 'text.primary',
                            '& .MuiChip-icon': { color: 'inherit' }
                          }} 
                        />
                      )}
                    </Stack>
                  </Box>
                </TableCell>

                {/* Status */}
                <TableCell sx={{ px: 2, py: 1.5 }}>
                  <Chip
                    label={statusCfg.label}
                    color={statusCfg.color}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                  />
                </TableCell>

                {/* Priority */}
                <TableCell sx={{ px: 2, py: 1.5 }}>
                  <Chip
                    label={priorityCfg.label}
                    color={priorityCfg.color}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                  />
                </TableCell>

                {/* Assignee */}
                <TableCell sx={{ px: 2, py: 1.5 }}>
                  {task.assigneeId ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.main', fontWeight: 'bold' }}>
                        {task.assigneeId.fullName?.charAt(0).toUpperCase() || 'A'}
                      </Avatar>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap>
                        {task.assigneeId.fullName?.split(' ')[0] || 'Assignee'}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.disabled" fontStyle="italic">Unassigned</Typography>
                  )}
                </TableCell>

                {/* Due Date */}
                <TableCell sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="caption" fontWeight={600} color={overdue ? 'error.main' : 'text.secondary'}>
                    {dueDateStr}
                  </Typography>
                </TableCell>

                {/* Created */}
                <TableCell sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">{createdStr}</Typography>
                </TableCell>

                {/* Actions */}
                <TableCell sx={{ px: 1.5, py: 1.5 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {task.status !== 'done' && (
                      <Tooltip title="Mark Complete">
                        <IconButton
                          size="small"
                          onClick={() => onMarkDone(task)}
                          disabled={movingTaskId === task.id}
                          sx={{ color: 'success.main', bgcolor: 'success.main' + '1A', '&:hover': { bgcolor: 'success.main' + '33' }, width: 26, height: 26 }}
                        >
                          <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />
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
                        <EditIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                    {movingTaskId === task.id ? (
                      <IconButton size="small" disabled sx={{ width: 26, height: 26 }}><CustomLoader size={14} /></IconButton>
                    ) : (
                      <DeleteTask taskId={task.id} onDeleteSuccess={onDeleteSuccess} />
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

TaskTableView.displayName = 'TaskTableView';
export default TaskTableView;
