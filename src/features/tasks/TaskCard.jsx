import React from 'react';
import {
  Typography, Box, Chip, Card, CardContent, IconButton, Avatar, useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CustomLoader from '../../components/CustomLoader';
import DeleteTask from './DeleteTask';

const priorityColorMap = {
  low: 'success',
  medium: 'warning',
  high: 'error'
};

/**
 * Individual task card with drag, edit, delete, and status actions.
 */
const TaskCard = React.memo(({
  task,
  colColor,
  highlightedTaskId,
  movingTaskId,
  onDragStart,
  onDragEnd,
  onKeyDown,
  onEditClick,
  onMarkDone,
  onDeleteSuccess,
  isDark
}) => {
  const theme = useTheme();

  return (
    <Card
      id={`task-card-${task.id}`}
      elevation={0}
      draggable={movingTaskId !== task.id}
      onDragStart={(event) => onDragStart(event, task.id)}
      onDragEnd={onDragEnd}
      onKeyDown={(event) => onKeyDown(event, task)}
      tabIndex={0}
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        cursor: 'grab',
        opacity: movingTaskId === task.id ? 0.6 : 1,
        boxShadow: highlightedTaskId === task.id
          ? `0 0 0 2px ${theme.palette.primary.main}, 0 4px 20px ${theme.palette.primary.main}40`
          : isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: isDark ? '0 6px 16px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.08)',
          borderColor: colColor
        },
        '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: '2px' },
        '&:active': { cursor: 'grabbing', transform: 'scale(0.98)' }
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3, color: 'text.primary' }}>
            {task.title || task.task || 'Untitled Task'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {task.status !== 'done' && (
              <IconButton
                onClick={() => onMarkDone(task)}
                size="small"
                disabled={movingTaskId === task.id}
                sx={{ color: 'success.main', bgcolor: 'success.main' + '1A', '&:hover': { bgcolor: 'success.main' + '33' }, width: 28, height: 28 }}
                title="Mark Complete"
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description || 'No description provided.'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip size="small" label={task.priority?.toUpperCase() || 'MEDIUM'} sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: 0.5, color: priorityColorMap[task.priority] ? `${priorityColorMap[task.priority]}.main` : 'text.primary', bgcolor: priorityColorMap[task.priority] ? `${priorityColorMap[task.priority]}.main` + '1A' : 'action.selected' }} />
          {task.dueDate && <Chip size="small" label={new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} sx={{ fontSize: '0.65rem', fontWeight: 600, bgcolor: 'action.hover' }} />}
          {task.approvalStatus === 'pending' && <Chip size="small" color="warning" label="Approval pending" sx={{ fontSize: '0.65rem', fontWeight: 600 }} />}
          {task.approvalStatus === 'rejected' && <Chip size="small" color="error" label="Rejected" sx={{ fontSize: '0.65rem', fontWeight: 600 }} />}
          {task.escalationLevel > 0 && <Chip size="small" color="error" variant="outlined" label={`SLA L${task.escalationLevel}`} sx={{ fontSize: '0.65rem', fontWeight: 600 }} />}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {task.assigneeId ? (
              <>
                <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: 'primary.main', fontWeight: 'bold' }}>
                  {task.assigneeId.fullName ? task.assigneeId.fullName.charAt(0).toUpperCase() : 'A'}
                </Avatar>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {task.assigneeId.fullName?.split(' ')[0] || 'Assignee'}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Unassigned</Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={() => onEditClick(task)} size="small" disabled={movingTaskId === task.id} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.main' + '1A' } }}>
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton>
            {movingTaskId === task.id ? (
              <IconButton size="small" disabled><CustomLoader size={16} /></IconButton>
            ) : (
              <DeleteTask taskId={task.id} onDeleteSuccess={onDeleteSuccess} />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
