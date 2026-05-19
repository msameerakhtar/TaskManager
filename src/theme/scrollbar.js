/**
 * Custom Scrollbar Styling Utility
 * Provides theme-aware, modern, premium scrollbar styles
 * Auto-hides scrollbars in all modals, dialogs, and popovers as requested
 */
export const getScrollbarStyles = (mode) => {
  const isDark = mode === 'dark';

  // Harmonious theme colors matching your premium palette
  const thumbColor = isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(15, 23, 42, 0.3)';
  const thumbHoverColor = isDark ? 'rgba(99, 102, 241, 0.75)' : 'rgba(99, 102, 241, 0.8)';
  const trackColor = isDark ? 'rgba(15, 23, 42, 0.15)' : 'rgba(241, 245, 249, 0.5)';

  return `
    /* ========================================== */
    /* 1. Global Custom Scrollbar Styling        */
    /* ========================================== */
    
    /* Width & Height of scrollbar */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    /* Track/gutter background */
    ::-webkit-scrollbar-track {
      background: ${trackColor};
      border-radius: 100px;
    }

    /* Scrollbar Handle/Thumb */
    ::-webkit-scrollbar-thumb {
      background: ${thumbColor};
      border-radius: 100px;
      border: 2px solid transparent;
      background-clip: padding-box;
      transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Hover state for Handle/Thumb */
    ::-webkit-scrollbar-thumb:hover {
      background: ${thumbHoverColor};
      border: 2px solid transparent;
      background-clip: padding-box;
      box-shadow: 0 0 8px ${isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)'};
    }

    /* Active state when clicking scrollbar */
    ::-webkit-scrollbar-thumb:active {
      background: ${isDark ? '#818cf8' : '#4f46e5'};
      border: 1px solid transparent;
      background-clip: padding-box;
    }

    /* Firefox Support */
    * {
      scrollbar-width: thin;
      scrollbar-color: ${thumbColor} ${trackColor};
    }

    /* ========================================== */
    /* 2. Hide Scrollbars Inside All Modals/Dialogs*/
    /* ========================================== */
    
    /* Hides vertical/horizontal scrollbars inside any Dialog, Modal, Popover, or drawer content */
    .MuiModal-root *::-webkit-scrollbar,
    .MuiDialog-root *::-webkit-scrollbar,
    .MuiPopover-root *::-webkit-scrollbar,
    .MuiDrawer-root *::-webkit-scrollbar,
    .modal-content-container *::-webkit-scrollbar,
    [role="dialog"] *::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }

    .MuiModal-root *,
    .MuiDialog-root *,
    .MuiPopover-root *,
    .MuiDrawer-root *,
    .modal-content-container *,
    [role="dialog"] * {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
  `;
};
