import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Typography
} from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import SettingsApplicationsIcon from '@material-ui/icons/Settings';
import FilterListIcon from '@material-ui/icons/FilterList';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import ViewColumnIcon from '@material-ui/icons/ViewColumn';

const useStyles = makeStyles((theme) => ({
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    cursor: 'pointer',
    fontFamily: '"Inter", sans-serif',
  },
  menuItem: {
    fontFamily: '"Inter", sans-serif',
    fontSize: '0.875rem',
    color: '#374151',
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
    color: '#9CA3AF',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.04)',
      color: '#111827'
    }
  },
  menuPaper: {
    borderRadius: 8,
    boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
    minWidth: 200,
  }
}));

export default function CustomColumnMenu({ columnName, onCustomAction, onHideColumn, onManageColumns }) {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    event.stopPropagation(); // Prevent triggering material-table's default sort
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  const handleAction = (event, actionType) => {
    event.stopPropagation();
    setAnchorEl(null);
    if (actionType === 'custom' && onCustomAction) {
      onCustomAction(columnName);
    } else if (actionType === 'hide' && onHideColumn) {
      onHideColumn();
    } else if (actionType === 'manage' && onManageColumns) {
      onManageColumns();
    } else {
      console.log(`Action ${actionType} triggered on column ${columnName}`);
    }
  };

  return (
    <Box className={classes.headerContainer}>
      <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
        {columnName}
      </Typography>
      <IconButton 
        className={classes.iconButton} 
        onClick={handleClick}
        size="small"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        classes={{ paper: classes.menuPaper }}
      >
        <MenuItem onClick={(e) => handleAction(e, 'asc')}>
          <ListItemIcon style={{ minWidth: 36 }}>
            <ArrowUpwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={<Typography className={classes.menuItem}>Sort by ASC</Typography>} />
        </MenuItem>
        
        <MenuItem onClick={(e) => handleAction(e, 'desc')}>
          <ListItemIcon style={{ minWidth: 36 }}>
            <ArrowDownwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={<Typography className={classes.menuItem}>Sort by DESC</Typography>} />
        </MenuItem>

        <MenuItem onClick={(e) => handleAction(e, 'custom')} style={{ marginTop: 8, borderTop: '1px solid #F3F4F6' }}>
          <ListItemIcon style={{ minWidth: 36 }}>
            <SettingsApplicationsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={<Typography className={classes.menuItem}>Do custom action</Typography>} />
        </MenuItem>

        <MenuItem onClick={(e) => handleAction(e, 'filter')}>
          <ListItemIcon style={{ minWidth: 36 }}>
            <FilterListIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={<Typography className={classes.menuItem}>Filter</Typography>} />
        </MenuItem>

        <MenuItem onClick={(e) => handleAction(e, 'hide')}>
          <ListItemIcon style={{ minWidth: 36 }}>
            <VisibilityOffIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={<Typography className={classes.menuItem}>Hide column</Typography>} />
        </MenuItem>

        <MenuItem onClick={(e) => handleAction(e, 'manage')}>
          <ListItemIcon style={{ minWidth: 36 }}>
            <ViewColumnIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={<Typography className={classes.menuItem}>Show all columns</Typography>} />
        </MenuItem>
      </Menu>
    </Box>
  );
}
