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
import { Base64ImageData } from '../../types';
import { downloadBase64Image, createBase64PreviewUrl } from '../../utils/base64Utils';
import { imageApi } from '../../services/imageApi';

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
  sketchPhotoPath?: string | null; // Legacy file path support
  sketchPhotoBase64?: Base64ImageData | null; // Legacy base64 data support
  sketchPhotoImageId?: string | null; // New GitLab image ID support
  capturedAt: string | null;
  surveyNumber: string;
  ownerName: string;
  showMetadata?: boolean;
  size?: 'small' | 'medium' | 'large';
  downloadable?: boolean;
}

const SketchPhotoDisplay: React.FC<SketchPhotoDisplayProps> = ({
  sketchPhotoPath,
  sketchPhotoBase64,
  sketchPhotoImageId,
  capturedAt,
  surveyNumber,
  ownerName,
  showMetadata = true,
  size = 'medium',
  downloadable = true
}) => {
  const [zoomDialog, setZoomDialog] = useState(false);

  // Determine the actual photo source (prioritize GitLab ID, then base64, then legacy path)
  const photoSource = sketchPhotoImageId 
    ? imageApi.generateImageUrl(sketchPhotoImageId)
    : sketchPhotoBase64?.data || sketchPhotoPath;
  const isGitLabImage = !!sketchPhotoImageId;
  const isBase64 = !!sketchPhotoBase64?.data && !isGitLabImage;
  const isDataUrl = (photoSource?.startsWith('data:') || false) && !isGitLabImage;
  const isLegacyPath = !isBase64 && !isDataUrl && !isGitLabImage && !!sketchPhotoPath;

  // Size configurations
  const sizeConfig = {
    small: { width: 120, height: 90 },
    medium: { width: 200, height: 150 },
    large: { width: 300, height: 225 }
  };

  const { width, height } = sizeConfig[size];

  // Handle download
  const handleDownload = async () => {
    if (!photoSource) return;

    try {
      // If we have base64 data, use the utility function
      if (isBase64 && sketchPhotoBase64) {
        console.log('📥 Downloading sketch photo from base64 data');
        
        const filename = `sketch_${surveyNumber}_${Date.now()}.${sketchPhotoBase64.type.split('/')[1] || 'jpg'}`;
        downloadBase64Image(sketchPhotoBase64.data, filename, sketchPhotoBase64.type);
        
        console.log('✅ Sketch photo downloaded successfully from base64!');
        return;
      }

      // Check if photoSource is a data URL (starts with data:)
      if (isDataUrl) {
        console.log('📥 Downloading sketch photo from data URL');
        
        // Create download link for data URL
        const link = document.createElement('a');
        link.href = photoSource;
        link.download = `sketch_${surveyNumber}_${Date.now()}.jpg`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Sketch photo downloaded successfully from data URL!');
        return;
      }

      // If it's a legacy file path, try to fetch from backend
      if (isLegacyPath) {
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
        return;
      }
    } catch (error: any) {
      console.error('❌ Error downloading sketch photo:', error);
      
      // If backend download fails, try to use the data URL if available
      if (isLegacyPath && !isDataUrl) {
        console.warn('⚠️ Backend download failed. Trying to use cached image data...');
        
        // Try to find the image in the DOM or use a fallback
        const imgElement = document.querySelector(`img[src*="${sketchPhotoPath?.split('/').pop()}"]`) as HTMLImageElement;
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
      
      if (isBase64) {
        console.error('❌ Failed to download sketch photo from base64 data.');
      } else if (isLegacyPath) {
        console.error('❌ Failed to download sketch photo. The file may not exist on the server.');
      } else {
        console.error('❌ Failed to download sketch photo. Unknown error.');
      }
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

  // Debug: Log sketch photo source type
  React.useEffect(() => {
    if (photoSource) {
      if (isBase64) {
        console.log('🖼️ SketchPhotoDisplay - Photo source: Base64 Data');
        console.log('🖼️ SketchPhotoDisplay - Base64 size:', sketchPhotoBase64?.size, 'bytes');
        console.log('🖼️ SketchPhotoDisplay - Base64 type:', sketchPhotoBase64?.type);
        console.log('✅ Using base64 data - image should display immediately');
      } else if (isDataUrl) {
        console.log('🖼️ SketchPhotoDisplay - Photo source: Data URL');
        console.log('🖼️ SketchPhotoDisplay - Photo source:', photoSource);
        console.log('✅ Using data URL - image should display immediately');
      } else if (isLegacyPath) {
        console.log('🖼️ SketchPhotoDisplay - Photo source: Legacy File Path');
        console.log('🖼️ SketchPhotoDisplay - Photo path:', sketchPhotoPath);
        console.log('⚠️ Using file path - image will try to load from backend');
      }
    }
  }, [photoSource, isBase64, isDataUrl, isLegacyPath, sketchPhotoBase64]);

  if (!photoSource && !sketchPhotoImageId) {
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
          image={isGitLabImage ? photoSource || '' :
                 isBase64 ? createBase64PreviewUrl(sketchPhotoBase64!.data, sketchPhotoBase64!.type) : 
                 isDataUrl ? photoSource || '' : 
                 `${getApiBaseUrl()}/${sketchPhotoPath}`}
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
            console.log('🖼️ Failed to load sketch photo from:', photoSource);
            
            if (isGitLabImage) {
              console.warn('⚠️ GitLab image failed to load. This might be a network or authentication issue.');
            } else if (isBase64) {
              console.warn('⚠️ Base64 image failed to load. This might be a data corruption issue.');
            } else if (isLegacyPath) {
              console.warn('⚠️ Backend image failed to load. This might be a file path issue.');
            }
          }}
          onLoad={() => {
            console.log('✅ Sketch photo loaded successfully from:', 
              isGitLabImage ? 'GitLab storage' :
              isBase64 ? 'base64 data' : 
              isDataUrl ? 'data URL' : 'backend path'
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
                  label={isBase64 ? 'Base64' : isDataUrl ? 'Data URL' : 'File Path'} 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    bgcolor: isBase64 ? 'rgba(0,255,0,0.3)' : 
                             isDataUrl ? 'rgba(0,150,255,0.3)' : 'rgba(255,165,0,0.3)',
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
            src={isBase64 ? createBase64PreviewUrl(sketchPhotoBase64!.data, sketchPhotoBase64!.type) : 
                 isDataUrl ? photoSource || '' : 
                 `${getApiBaseUrl()}/${sketchPhotoPath}`}
            alt={`Sketch photo for survey ${surveyNumber}`}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
            onError={(e) => {
              console.error('❌ Error loading sketch photo in zoom dialog:', e);
              console.log('🖼️ Failed to load sketch photo in zoom dialog from:', photoSource);
            }}
            onLoad={() => {
              console.log('✅ Sketch photo loaded successfully in zoom dialog from:', 
                isBase64 ? 'base64 data' : 
                isDataUrl ? 'data URL' : 'backend path'
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
