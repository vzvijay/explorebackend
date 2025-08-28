import React, { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';

interface SketchPhotoDisplayProps {
  sketchPhotoPath: string | null;
  capturedAt: string | null;
  surveyNumber: string;
  ownerName: string;
  showMetadata?: boolean;
  size?: 'small' | 'medium' | 'large';
  downloadable?: boolean;
}

const SketchPhotoDisplay: React.FC<SketchPhotoDisplayProps> = ({
  sketchPhotoPath,
  capturedAt,
  surveyNumber,
  ownerName,
  showMetadata = true,
  size = 'medium',
  downloadable = true
}) => {
  const [zoomDialog, setZoomDialog] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: { width: 120, height: 90 },
    medium: { width: 200, height: 150 },
    large: { width: 300, height: 225 }
  };

  const { width, height } = sizeConfig[size];

  // Handle download
  const handleDownload = async () => {
    if (!sketchPhotoPath) return;

    try {
      const response = await fetch(`http://localhost:3000/${sketchPhotoPath}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from path
      const filename = sketchPhotoPath.split('/').pop() || 'sketch_photo.jpg';
      link.download = `sketch_${surveyNumber}_${filename}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading sketch photo:', error);
    }
  };

  // Format capture date
  const formatCaptureDate = (dateString: string | null) => {
    if (!dateString) return 'Not captured';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!sketchPhotoPath) {
    return (
      <Card 
        sx={{ 
          width, 
          height, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'grey.100'
        }}
      >
        <CardContent sx={{ textAlign: 'center', p: 1 }}>
          <PhotoCameraIcon sx={{ fontSize: 32, color: 'grey.500', mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            No Sketch Photo
          </Typography>
          {showMetadata && (
            <Typography variant="caption" display="block" color="text.secondary">
              Survey: {surveyNumber}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ width, height, position: 'relative' }}>
        <CardMedia
          component="img"
          image={`http://localhost:3000/${sketchPhotoPath}`}
          alt={`Sketch photo for survey ${surveyNumber}`}
          sx={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            cursor: 'pointer'
          }}
          onClick={() => setZoomDialog(true)}
        />
        
        {/* Action buttons overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.5,
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 }
          }}
        >
          <Tooltip title="Zoom">
            <IconButton
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
              }}
              onClick={() => setZoomDialog(true)}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {downloadable && (
            <Tooltip title="Download">
              <IconButton
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                }}
                onClick={handleDownload}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Metadata overlay */}
        {showMetadata && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              p: 1
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ImageIcon fontSize="small" />
              <Typography variant="caption" noWrap>
                {surveyNumber}
              </Typography>
              {capturedAt && (
                <Chip 
                  label={formatCaptureDate(capturedAt)} 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }} 
                />
              )}
            </Stack>
          </Box>
        )}
      </Card>

      {/* Zoom Dialog */}
      <Dialog
        open={zoomDialog}
        onClose={() => setZoomDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, textAlign: 'center' }}>
          <img
            src={`http://localhost:3000/${sketchPhotoPath}`}
            alt={`Sketch photo for survey ${surveyNumber}`}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Survey: <strong>{surveyNumber}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Owner: <strong>{ownerName}</strong>
              </Typography>
              {capturedAt && (
                <Typography variant="body2" color="text.secondary">
                  Captured: <strong>{formatCaptureDate(capturedAt)}</strong>
                </Typography>
              )}
            </Box>
          </Stack>
          
          {downloadable && (
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              variant="outlined"
            >
              Download
            </Button>
          )}
          
          <Button onClick={() => setZoomDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SketchPhotoDisplay;
