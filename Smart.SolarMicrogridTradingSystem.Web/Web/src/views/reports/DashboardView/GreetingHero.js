import React, { useState, useEffect } from 'react';
import { Typography, Box, makeStyles } from '@material-ui/core';
import tokenService from '../../../utils/tokenDecoder';
import EventOutlinedIcon from '@material-ui/icons/EventOutlined';

const useStyles = makeStyles((theme) => ({
  heroContainer: {
    position: 'relative',
    width: `calc(100% + ${theme.spacing(6)}px)`,
    height: 320,
    marginTop: theme.spacing(-3), // Pull up to negate container padding
    marginLeft: theme.spacing(-3), // Pull left to negate container padding
    marginRight: theme.spacing(-3), // Pull right to negate container padding
    backgroundImage: props => props.gradient,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: theme.spacing(6, 8),
    boxSizing: 'border-box',
    transition: 'background-image 1s ease-in-out'
  },
  datePill: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: '6px 12px',
    borderRadius: 8,
    color: '#E5E7EB',
    marginBottom: theme.spacing(2),
    width: 'fit-content',
    backdropFilter: 'blur(4px)'
  },
  greeting: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 700,
    fontSize: '3rem',
    color: '#ffffff',
    letterSpacing: '-1px',
    marginBottom: theme.spacing(2)
  },
  subtitle: {
    fontFamily: '"Inter", sans-serif',
    fontSize: '1.05rem',
    fontWeight: 400,
    color: '#E5E7EB',
    maxWidth: 600,
    lineHeight: 1.5
  }
}));

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
};

const getTimeOfDayGradient = () => {
  const hour = new Date().getHours();
  
  // Morning (5am - 12pm): beautiful blue sky transitioning to a warm sunrise tone
  if (hour >= 5 && hour < 12) {
    return 'linear-gradient(90deg, rgba(41, 128, 185, 0.8) 0%, rgba(241, 196, 15, 0.6) 100%), url("/static/images/morning_bg.png")';
  }
  // Afternoon (12pm - 17pm): clear blue sky mixed with agricultural green
  if (hour >= 12 && hour < 17) {
    return 'linear-gradient(90deg, rgba(21, 101, 192, 0.8) 0%, rgba(46, 204, 113, 0.7) 100%), url("/static/images/noon_bg.png")';
  }
  // Evening (17pm - 20pm): sunset, twilight purples and oranges
  if (hour >= 17 && hour < 20) {
    return 'linear-gradient(90deg, rgba(142, 68, 173, 0.8) 0%, rgba(230, 126, 34, 0.6) 100%), url("/static/images/evening_bg.png")';
  }
  // Night (20pm - 5am): deep dark starry night sky, black/dark blue
  return 'linear-gradient(90deg, rgba(10, 15, 36, 0.85) 0%, rgba(27, 38, 79, 0.8) 100%), url("/static/images/night_bg.png")';
};

const GreetingHero = () => {
  const [gradient, setGradient] = useState('');
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [userName, setUserName] = useState('admin');

  // Pass dynamic gradient to makeStyles
  const classes = useStyles({ gradient });

  useEffect(() => {
    setGreeting(getGreeting());
    setGradient(getTimeOfDayGradient());
    
    try {
      const name = tokenService.getUserNameFromToken();
      if (name) setUserName(name.toLowerCase());
    } catch (err) {
      console.log('Error decoding token', err);
    }
    
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    setDateStr(new Date().toLocaleDateString('en-US', options));
  }, []);

  return (
    <Box className={classes.heroContainer}>
      <Box className={classes.datePill}>
        <EventOutlinedIcon style={{ fontSize: 18, marginRight: 8, opacity: 0.8 }} />
        <Typography style={{ fontSize: '0.85rem', fontFamily: '"Inter", sans-serif', fontWeight: 500 }}>
          {dateStr}
        </Typography>
      </Box>

      <Typography variant="h1" className={classes.greeting}>
        {greeting}, {userName}
      </Typography>

      <Typography className={classes.subtitle}>
        Here's what's happening across your farm today. All systems are running smoothly with 2 alerts that need your attention.
      </Typography>
    </Box>
  );
};

export default GreetingHero;
