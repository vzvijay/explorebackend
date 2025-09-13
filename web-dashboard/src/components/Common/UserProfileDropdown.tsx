import React from 'react';
import {
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar
} from '@mui/material';
import {
  AccountCircle,
  Settings,
  Help,
  Logout,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfileDropdownProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onLogout: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  anchorEl,
  onClose,
  onLogout
}) => {
  const { user } = useAuth();
  const open = Boolean(anchorEl);

  const handleProfileClick = () => {
    onClose();
    // Navigate to profile page (can be implemented later)
    // navigate('/profile');
  };

  const handleSettingsClick = () => {
    onClose();
    // Navigate to settings page (can be implemented later)
    // navigate('/settings');
  };

  const handleHelpClick = () => {
    onClose();
    // Navigate to help page (can be implemented later)
    // navigate('/help');
  };

  const handleLogoutClick = () => {
    onClose();
    onLogout();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      onClick={onClose}
      PaperProps={{
        elevation: 3,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          minWidth: 200,
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* User Info Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <Person />
          </Avatar>
          <Box sx={{ ml: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Menu Items */}
      <MenuItem onClick={handleProfileClick}>
        <ListItemIcon>
          <AccountCircle fontSize="small" />
        </ListItemIcon>
        <ListItemText>User Profile</ListItemText>
      </MenuItem>

      <MenuItem onClick={handleSettingsClick}>
        <ListItemIcon>
          <Settings fontSize="small" />
        </ListItemIcon>
        <ListItemText>Account Settings</ListItemText>
      </MenuItem>

      <MenuItem onClick={handleHelpClick}>
        <ListItemIcon>
          <Help fontSize="small" />
        </ListItemIcon>
        <ListItemText>Help & Support</ListItemText>
      </MenuItem>

      <Divider />

      {/* Logout - Highlighted */}
      <MenuItem 
        onClick={handleLogoutClick}
        sx={{
          color: 'error.main',
          '&:hover': {
            backgroundColor: 'error.light',
            color: 'error.contrastText',
          },
        }}
      >
        <ListItemIcon sx={{ color: 'inherit' }}>
          <Logout fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default UserProfileDropdown;
