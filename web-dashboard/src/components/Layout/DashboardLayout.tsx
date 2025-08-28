import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  ButtonGroup,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  AccountCircle,
  Menu as MenuIcon,
  Dashboard,
  Home,
  Add,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import UserProfileDropdown from '../Common/UserProfileDropdown';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const mobileMenuItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { text: 'Properties', path: '/properties', icon: <Home /> },
    ...(user?.role === 'field_executive' ? [{ text: 'New Survey', path: '/survey', icon: <Add /> }] : [])
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {/* Logo/Title - Always visible */}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              lineHeight: { xs: 1.2, sm: 1.5 }
            }}
          >
            Maharashtra Survey Management
          </Typography>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <>
              <ButtonGroup variant="text" sx={{ mr: 2 }}>
                <Button color="inherit" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button color="inherit" onClick={() => navigate('/properties')}>
                  Properties
                </Button>
                {user?.role === 'field_executive' && (
                  <Button color="inherit" onClick={() => navigate('/survey')}>
                    New Survey
                  </Button>
                )}
              </ButtonGroup>
              
              <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                Welcome, {user?.first_name} {user?.last_name}
              </Typography>
            </>
          )}
          
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleMobileMenuToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Profile Button - Always visible */}
          <IconButton
            color="inherit"
            onClick={handleProfileClick}
            sx={{
              p: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '1rem'
              }}
            >
              <Person />
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: 'background.paper',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Navigation
          </Typography>
        </Box>
        
        <List sx={{ pt: 1 }}>
          {mobileMenuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton 
                onClick={() => handleMobileNavigation(item.path)}
                sx={{
                  py: 2,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        {/* User Info in Mobile Menu */}
        <Box sx={{ px: 2, py: 1.5 }}>
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
        
        {/* Logout in Mobile Menu */}
        <List>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={handleLogout}
              sx={{
                py: 2,
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.contrastText',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      
      {/* User Profile Dropdown */}
      <UserProfileDropdown
        anchorEl={profileAnchorEl}
        onClose={handleProfileClose}
        onLogout={handleLogout}
      />
      
      <Container component="main" sx={{ mt: 3, mb: 3, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default DashboardLayout; 