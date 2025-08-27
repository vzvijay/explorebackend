import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  ButtonGroup
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Maharashtra Survey Management
          </Typography>
          
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
            {['admin', 'municipal_officer', 'engineer'].includes(user?.role || '') && (
              <Button color="inherit" onClick={() => navigate('/admin')}>
                Admin Dashboard
              </Button>
            )}
          </ButtonGroup>
          
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.first_name} {user?.last_name} ({user?.role})
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ mt: 3, mb: 3, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default DashboardLayout; 