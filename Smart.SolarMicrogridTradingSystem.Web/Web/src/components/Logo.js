import React from 'react';
import { Box, makeStyles } from '@material-ui/core';
import sessionStorageReadWrite from 'src/utils/sessionStorageReadWrite';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer'
  },
  mark: {
    width: 40,
    height: 40
  },
  wordmark: {
    fontFamily: '"Fraunces", Georgia, serif',
    fontWeight: 700,
    fontSize: 19,
    color: '#1d4a30',
    letterSpacing: '-0.01em'
  }
}));

const Logo = (props) => {
  const classes = useStyles();

  function ClearScreenMemory() {
    sessionStorageReadWrite.removeLastSelectedMainMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedParentMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedScreenIDFromSession();
  }

  return (
    <Box className={classes.root} onClick={() => ClearScreenMemory()}>
      <img alt="SolarGrid" src="/logo-solar.svg" className={classes.mark} />
      <span className={classes.wordmark}>SolarGrid</span>
    </Box>
  );
};

export default Logo;
