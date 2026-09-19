import React from 'react';
import { IconButton, Tooltip, Box, makeStyles } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'flex-end'
  }
}));

export default function PageHeader({ onClick, isEdit, toolTiptitle }) {
  const classes = useStyles();
  const navigate = useNavigate();
  
  return (
    <Box className={classes.root}>
      {isEdit ? (
        <Tooltip title={toolTiptitle || 'Add'}>
          <IconButton onClick={onClick} style={{ backgroundColor: '#1a1a1a', color: '#fff', borderRadius: '8px', padding: '8px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Go Back">
          <IconButton onClick={() => onClick ? onClick() : navigate(-1)} style={{ color: '#1a1a1a', backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '8px', marginRight: '16px' }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
