import { createMuiTheme, colors } from '@material-ui/core';
import shadows from './shadows';
import typography from './typography';

const theme = createMuiTheme({
  palette: {
    background: {
      dark: '#F4F6F8',
      default: colors.common.white,
      paper: colors.common.white
    },
    primary: {
      main: colors.indigo[500]
    },
    secondary: {
      main: colors.indigo[500]
    },
    text: {
      primary: colors.blueGrey[900],
      secondary: colors.blueGrey[600]
    }
  },
  shadows,
  typography,
  overrides: {
    MuiOutlinedInput: {
      root: {
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        '& $notchedOutline': {
          borderColor: '#E5E7EB',
        },
        '&:hover $notchedOutline': {
          borderColor: '#111827',
        },
        '&$focused $notchedOutline': {
          borderColor: '#111827',
          borderWidth: 1,
        },
      },
    },
    MuiInputLabel: {
      outlined: {
        color: '#4B5563',
        fontWeight: 500,
      }
    }
  }
});

export default theme;
