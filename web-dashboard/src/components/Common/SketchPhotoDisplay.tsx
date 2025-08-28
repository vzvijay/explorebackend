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

// Utility function to get API base URL (same as PropertySurveyForm)
const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log('🌐 SketchPhotoDisplay - Environment API URL:', apiUrl);
  
  if (apiUrl) {
    return apiUrl.replace('/api', ''); // Remove /api suffix for file paths
  }
  
  // Fallback for development
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const fallbackUrl = isDevelopment ? 'http://localhost:3000' : 'https://your-railway-app-name.railway.app';
  
  console.log('🔄 SketchPhotoDisplay - Using fallback API URL:', fallbackUrl);
  return fallbackUrl;
};

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
      // Check if sketchPhotoPath is a data URL (starts with data:)
      if (sketchPhotoPath.startsWith('data:')) {
        console.log('📥 Downloading sketch photo from data URL');
        
        // Create download link for data URL
        const link = document.createElement('a');
        link.href = sketchPhotoPath;
        link.download = `sketch_${surveyNumber}_${Date.now()}.jpg`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Sketch photo downloaded successfully from data URL!');
        return;
      }

      // If it's a file path, try to fetch from backend
      const baseUrl = getApiBaseUrl();
      const downloadUrl = `${baseUrl}/${sketchPhotoPath}`;
      
      console.log('📥 Downloading sketch photo from backend:', downloadUrl);
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
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
      
      console.log('✅ Sketch photo downloaded successfully from backend!');
    } catch (error: any) {
      console.error('❌ Error downloading sketch photo:', error);
      
      // If backend download fails, try to use the data URL if available
      if (sketchPhotoPath && !sketchPhotoPath.startsWith('data:')) {
        console.warn('⚠️ Backend download failed. Trying to use cached image data...');
        
        // Try to find the image in the DOM or use a fallback
        const imgElement = document.querySelector(`img[src*="${sketchPhotoPath.split('/').pop()}"]`) as HTMLImageElement;
        if (imgElement && imgElement.src && imgElement.src.startsWith('data:')) {
          const link = document.createElement('a');
          link.href = imgElement.src;
          link.download = `sketch_${surveyNumber}_${Date.now()}.jpg`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ Sketch photo downloaded from cached data!');
          return;
        }
      }
      
      console.error('❌ Failed to download sketch photo. The file may not exist on the server.');
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

  // Debug: Log sketch photo path type
  React.useEffect(() => {
    if (sketchPhotoPath) {
      console.log('🖼️ SketchPhotoDisplay - Photo path type:', 
        sketchPhotoPath.startsWith('data:') ? 'Data URL' : 'File Path'
      );
      console.log('🖼️ SketchPhotoDisplay - Photo path:', sketchPhotoPath);
      
      if (sketchPhotoPath.startsWith('data:')) {
        console.log('✅ Using data URL - image should display immediately');
      } else {
        console.log('⚠️ Using file path - image will try to load from backend');
      }
    }
  }, [sketchPhotoPath]);

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
          image={sketchPhotoPath.startsWith('data:') ? sketchPhotoPath : `${getApiBaseUrl()}/${sketchPhotoPath}`}
          alt={`Sketch photo for survey ${surveyNumber}`}
          sx={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            cursor: 'pointer'
          }}
          onClick={() => setZoomDialog(true)}
          onError={(e) => {
            console.error('❌ Error loading sketch photo image:', e);
            console.log('🖼️ Failed to load sketch photo from:', sketchPhotoPath);
            
            // If it's a file path and fails, try to show a fallback
            if (!sketchPhotoPath.startsWith('data:')) {
              console.warn('⚠️ Backend image failed to load. This might be a file path issue.');
            }
          }}
          onLoad={() => {
            console.log('✅ Sketch photo loaded successfully from:', 
              sketchPhotoPath.startsWith('data:') ? 'data URL' : 'backend path'
            );
          }}
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
              {/* Debug info - show source type */}
              {import.meta.env.MODE === 'development' && (
                <Chip 
                  label={sketchPhotoPath.startsWith('data:') ? 'Data URL' : 'File Path'} 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    bgcolor: sketchPhotoPath.startsWith('data:') ? 'rgba(0,255,0,0.3)' : 'rgba(255,165,0,0.3)',
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
            src={sketchPhotoPath.startsWith('data:') ? sketchPhotoPath : `${getApiBaseUrl()}/${sketchPhotoPath}`}
            alt={`Sketch photo for survey ${surveyNumber}`}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
            onError={(e) => {
              console.error('❌ Error loading sketch photo in zoom dialog:', e);
              console.log('🖼️ Failed to load sketch photo in zoom dialog from:', sketchPhotoPath);
            }}
            onLoad={() => {
              console.log('✅ Sketch photo loaded successfully in zoom dialog from:', 
                sketchPhotoPath.startsWith('data:') ? 'data URL' : 'backend path'
              );
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
