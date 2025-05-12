/**
 * Theme configuration for the application
 */

import { createTheme } from '@material-ui/core/styles';

// Define color palette
const palette = {
  primary: {
    main: '#4285f4',
    light: '#80b1ff',
    dark: '#0059c1',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#34a853',
    light: '#6edb83',
    dark: '#007826',
    contrastText: '#ffffff'
  },
  error: {
    main: '#ea4335',
    light: '#ff7961',
    dark: '#b00020',
    contrastText: '#ffffff'
  },
  warning: {
    main: '#fbbc05',
    light: '#ffef62',
    dark: '#c49000',
    contrastText: '#000000'
  },
  info: {
    main: '#4285f4',
    light: '#80b1ff',
    dark: '#0059c1',
    contrastText: '#ffffff'
  },
  success: {
    main: '#34a853',
    light: '#6edb83',
    dark: '#007826',
    contrastText: '#ffffff'
  },
  text: {
    primary: '#202124',
    secondary: '#5f6368',
    disabled: '#9aa0a6',
    hint: '#9aa0a6'
  },
  background: {
    paper: '#ffffff',
    default: '#f5f5f5'
  }
};

// Create theme with light mode
const lightTheme = createTheme({
  palette,
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.2
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.2
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.2
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.2
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.2
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'uppercase'
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 2.66,
      textTransform: 'uppercase'
    }
  },
  shape: {
    borderRadius: 4
  },
  props: {
    MuiButton: {
      disableElevation: true
    },
    MuiPaper: {
      elevation: 0
    }
  },
  overrides: {
    MuiButton: {
      root: {
        textTransform: 'none',
        padding: '8px 16px'
      },
      contained: {
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '&:hover': {
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)'
        }
      }
    },
    MuiCard: {
      root: {
        boxShadow: '0 2px 10px 0 rgba(0, 0, 0, 0.1)',
        borderRadius: 8
      }
    },
    MuiCardHeader: {
      root: {
        padding: '16px 24px'
      }
    },
    MuiCardContent: {
      root: {
        padding: '24px'
      }
    },
    MuiCardActions: {
      root: {
        padding: '16px 24px'
      }
    },
    MuiTextField: {
      root: {
        marginBottom: 16
      }
    },
    MuiInputBase: {
      root: {
        borderRadius: 4
      }
    },
    MuiOutlinedInput: {
      root: {
        borderRadius: 4
      }
    },
    MuiTableHead: {
      root: {
        backgroundColor: '#f5f5f5'
      }
    },
    MuiTableRow: {
      root: {
        '&:nth-of-type(even)': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }
      }
    }
  }
});

// Create theme with dark mode
const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    ...palette,
    type: 'dark',
    primary: {
      ...palette.primary,
      main: '#80b1ff'
    },
    secondary: {
      ...palette.secondary,
      main: '#6edb83'
    },
    background: {
      paper: '#1e1e1e',
      default: '#121212'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#6c6c6c',
      hint: '#6c6c6c'
    }
  },
  overrides: {
    ...lightTheme.overrides,
    MuiCard: {
      root: {
        boxShadow: '0 2px 10px 0 rgba(0, 0, 0, 0.3)',
        borderRadius: 8
      }
    },
    MuiTableHead: {
      root: {
        backgroundColor: '#2c2c2c'
      }
    },
    MuiTableRow: {
      root: {
        '&:nth-of-type(even)': {
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }
      }
    }
  }
});

// Export both themes and a default theme
export { lightTheme, darkTheme };
export default lightTheme; // Add default export