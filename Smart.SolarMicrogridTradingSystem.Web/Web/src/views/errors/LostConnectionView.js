import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  makeStyles
} from '@material-ui/core';
import Page from 'src/components/Page';
import NetworkCheckRoundedIcon from '@material-ui/icons/NetworkCheckRounded';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    height: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3),
    backgroundColor: "rgba(255,255,255,1)",
    borderRadius: "20px",
  },
  image: {
    marginTop: 50,
    display: 'inline-block',
    maxWidth: '100%',
    width: 560
  }
}));

const LostConnectionView = () => {

  const classes = useStyles();

  return (
    <Page
      className={classes.root}
      title=""
    >

      <Box
        display="flex"
        flexDirection="column"
        height="100%"
        justifyContent="center"
      >
        <Container maxWidth="md">
          {/* <Box textAlign="center" >
            <img
              id="stream"
              alt="Under development"
              className={classes.image}
              src="/static/images/connection_lost.png"
            />
          </Box> */}
          <Typography
            align="center"
          >
            <NetworkCheckRoundedIcon
              style={{ fontSize: 70, color: "red" }}
            />
          </Typography>
          <Typography
            align="center"
            color="textPrimary"
            variant="h3"
          >
            Connection Lost
          </Typography>
          <Typography
            align="center"
            color="textPrimary"
            variant="subtitle2"
          >
            Looks like you have lost connection with Wifi or other internet connection
          </Typography>
          <Typography
            align="center"
            color="textPrimary"
            variant="subtitle2"
          >
            Please check your connection
          </Typography>

        </Container>
      </Box>
    </Page>
  );
};

export default LostConnectionView;
