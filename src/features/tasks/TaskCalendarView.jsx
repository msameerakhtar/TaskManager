import React, { useMemo, useState } from 'react';
import { Box, Paper, useTheme, Tooltip } from '@mui/material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const STATUS_COLORS = {
  todo: '#0288d1',
  in_progress: '#ed6c02',
  done: '#2e7d32',
};

const TaskCalendarView = ({ tasks, onEditClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  const events = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate)
      .map((t) => {
        const start = new Date(t.dueDate);
        const end = new Date(start);
        end.setHours(end.getHours() + 1); // 1 hour duration by default if no time specified
        
        return {
          id: t.id,
          title: t.title || t.task || 'Untitled Task',
          start,
          end,
          resource: t,
        };
      });
  }, [tasks]);

  const eventStyleGetter = (event, start, end, isSelected) => {
    const status = event.resource.status || 'todo';
    const color = STATUS_COLORS[status];
    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        padding: '2px 6px',
        boxShadow: isSelected ? `0 0 0 2px ${isDark ? '#1e293b' : 'white'}, 0 0 0 4px ${color}` : 'none'
      }
    };
  };

  const CustomEvent = ({ event }) => {
    const overdue = event.resource.status !== 'done' && event.start < new Date();
    return (
      <Tooltip title={`${event.title} (${event.resource.status})`} arrow placement="top">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
          {overdue && <span style={{ color: '#ffeb3b', fontSize: '10px' }}>⚠️</span>}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {event.title}
          </span>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        height: '78vh',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        '& .rbc-calendar': {
          fontFamily: theme.typography.fontFamily,
        },
        '& .rbc-header': {
          py: 1.5,
          fontWeight: 800,
          borderColor: 'divider',
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
          color: 'text.secondary',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.5px'
        },
        '& .rbc-month-view, & .rbc-time-view, & .rbc-agenda-view': {
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden'
        },
        '& .rbc-day-bg, & .rbc-month-row': {
          borderColor: 'divider',
        },
        '& .rbc-off-range-bg': {
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        },
        '& .rbc-today': {
          bgcolor: isDark ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
        },
        '& .rbc-event': {
          transition: 'transform 0.1s',
          '&:hover': {
            transform: 'scale(1.02)'
          }
        },
        '& .rbc-btn-group button': {
          color: 'text.primary',
          borderColor: 'divider',
          textTransform: 'capitalize',
          fontWeight: 600,
          '&.rbc-active': {
            bgcolor: 'primary.main',
            color: 'white',
            borderColor: 'primary.main',
            boxShadow: 'none',
            '&:hover': { bgcolor: 'primary.dark' }
          },
          '&:hover:not(.rbc-active)': {
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          }
        },
        '& .rbc-toolbar button:active, & .rbc-toolbar button.rbc-active:hover, & .rbc-toolbar button.rbc-active:focus': {
            bgcolor: 'primary.main',
            color: 'white'
        },
        '& .rbc-toolbar-label': {
            fontWeight: 800,
            fontSize: '1.2rem',
            color: 'text.primary'
        }
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        date={currentDate}
        view={currentView}
        onNavigate={(date) => setCurrentDate(date)}
        onView={(view) => setCurrentView(view)}
        onSelectEvent={(event) => onEditClick(event.resource)}
        eventPropGetter={eventStyleGetter}
        components={{
          event: CustomEvent
        }}
        views={['month', 'week', 'day', 'agenda']}
        popup
        tooltipAccessor={null}
      />
    </Paper>
  );
};

export default TaskCalendarView;
