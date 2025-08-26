import React from 'react';
import {
  Typography,
  Box
} from '@mui/material';

const PropertyDetailPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Property Details
      </Typography>
      <Typography variant="body1">
        Individual property details will be shown here.
      </Typography>
    </Box>
  );
};

export default PropertyDetailPage; 