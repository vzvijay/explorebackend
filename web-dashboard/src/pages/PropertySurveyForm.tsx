import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Paper,
  Stepper,
  Step,
  StepLabel,

  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  LocationOn,
  Clear,
  PhotoCamera,
  Edit,
  Save,
  Send,
  Person,
  Home,
  Add,
  Delete
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { Base64ImageData } from '../types';
import { propertiesApi } from '../services/api';


// Interfaces
interface FormData {
  survey_number: string;
  old_mc_property_number: string;
  register_no: string;
  owner_name: string;
  owner_father_name: string;
  owner_phone: string;
  owner_email: string;
  aadhar_number: string;
  house_number: string;
  street_name: string;
  locality: string;
  ward_number: string;
  pincode: string;
  zone: string;
  property_type: string;
  construction_type: string;
  construction_year: string | null;
  number_of_floors: number;
  building_permission: boolean;
  bp_number: string;
  bp_date: string;
  plot_area: string;
  built_up_area: string;
  carpet_area: string;
  water_connection: number;
  water_connection_number: string;
  water_connection_date: string;
  electricity_connection: boolean;
  electricity_connection_number: string;
  sewage_connection: boolean;
  solar_panel: boolean;
  rain_water_harvesting: boolean;
  latitude: string;
  longitude: string;
  address: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  ward_number_from_gps: string;
  area_from_gps: string;
  remarks: string;
  edit_comment: string;
}

interface PropertyUseDetails {
  halls: Room[];
  bedrooms: Room[];
  kitchens: Room[];
  shops: Room[];
  bathrooms: Room[];
}

interface Room {
  id: string;
  length: number;
  width: number;
  area: number;
}

interface PropertySurveyFormProps {
  editMode?: boolean;
  propertyToEdit?: any;
  onEditComplete?: () => void;
}

// Main Component
const PropertySurveyForm: React.FC<PropertySurveyFormProps> = ({ 
  editMode = false, 
  propertyToEdit = null, 
  onEditComplete 
}) => {


  // Constants
  const steps = [
    'Basic Information',
    'Property Details & Permissions', 
    'Area Measurements & Property Use',
    'Utilities & Connections',
    'Location, Photos & Signature',
    'Sketch Photo Capture',
    'Review & Submit'
  ];

  // State variables
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditMode] = useState(editMode);
  const [editingProperty] = useState(propertyToEdit);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [sketchPhotoDialogOpen, setSketchPhotoDialogOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [sketchPhoto, setSketchPhoto] = useState<string | null>(null);
  const [sketchPhotoBase64, setSketchPhotoBase64] = useState<Base64ImageData | null>(null);
  const [photoCapturing, setPhotoCapturing] = useState(false);
  const [sketchPhotoCapturing, setSketchPhotoCapturing] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    survey_number: `SUR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    old_mc_property_number: '',
    register_no: '',
    owner_name: '',
    owner_father_name: '',
    owner_phone: '',
    owner_email: '',
    aadhar_number: '',
    house_number: '',
    street_name: '',
    locality: '',
    ward_number: '',
    pincode: '',
    zone: 'A',
    property_type: '',
    construction_type: '',
    construction_year: '',
    number_of_floors: 1,
    building_permission: false,
    bp_number: '',
    bp_date: '',
    plot_area: '',
    built_up_area: '',
    carpet_area: '',
    water_connection: 0,
    water_connection_number: '',
    water_connection_date: '',
    electricity_connection: false,
    electricity_connection_number: '',
    sewage_connection: false,
    solar_panel: false,
    rain_water_harvesting: false,
    latitude: '',
    longitude: '',
    address: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    ward_number_from_gps: '',
    area_from_gps: '',
    remarks: '',
    edit_comment: ''
  });

  // GPS and location state
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [capturedAddress, setCapturedAddress] = useState<string | null>(null);
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Property use state
  const [propertyUse, setPropertyUse] = useState<PropertyUseDetails>({
    halls: [],
    bedrooms: [],
    kitchens: [],
    shops: [],
    bathrooms: []
  });


  // Utility functions
  const validateAadhar = (aadhar: string): boolean => {
    const aadharRegex = /^\d{4}-\d{4}-\d{4}$/;
    return aadharRegex.test(aadhar);
  };

  const formatAadharNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 12 digits
    const limitedDigits = digits.slice(0, 12);
    
    // Format as 1234-5678-9012
    if (limitedDigits.length <= 4) {
      return limitedDigits;
    } else if (limitedDigits.length <= 8) {
      return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4)}`;
    } else {
      return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4, 8)}-${limitedDigits.slice(8)}`;
    }
  };

  const handleAadharChange = (value: string) => {
    const formatted = formatAadharNumber(value);
    handleInputChange('aadhar_number', formatted);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.owner_name.trim()) errors.push('Property Owner Name');
    if (!formData.locality.trim()) errors.push('Locality');
    if (!formData.ward_number.trim()) errors.push('Ward Number');
    if (!formData.pincode.trim()) errors.push('Pincode');
    if (!formData.zone.trim()) errors.push('Zone');
    if (!formData.property_type.trim()) errors.push('Property Type');
    if (!formData.construction_type.trim()) errors.push('Construction Type');
    if (!formData.plot_area.trim()) errors.push('Plot Area');
    if (!formData.built_up_area.trim()) errors.push('Built-up Area');
    if (!formData.carpet_area.trim()) errors.push('Carpet Area');
    
    return errors;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // GPS Functions - Enhanced Implementation with Fallbacks
  const getCurrentLocation = async () => {
    console.log('📍 GPS: Starting location capture...');
    setLocationLoading(true);
    setLocationError(null);
    
    // Clear any previous errors
    setLocationError(null);
    
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      console.log('📍 GPS: Geolocation supported, attempting to get location...');
      
      // Try multiple GPS strategies
      let position: GeolocationPosition | null = null;
      
      // Strategy 1: High accuracy with longer timeout
      try {
        console.log('📍 GPS: Strategy 1 - High accuracy GPS...');
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          const options = {
            enableHighAccuracy: true,
            timeout: 45000, // 45 seconds for high accuracy
            maximumAge: 0
          };
          
          console.log('📍 GPS: High accuracy options:', options);
          
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log('📍 GPS: High accuracy success!', pos);
              resolve(pos);
            },
            (error) => {
              console.log('📍 GPS: High accuracy failed:', error);
              reject(error);
            },
            options
          );
        });
      } catch (error: any) {
        console.log('📍 GPS: High accuracy failed, trying low accuracy...');
        
        // Strategy 2: Low accuracy (faster, works indoors)
        try {
          position = await new Promise<GeolocationPosition>((resolve, reject) => {
            const options = {
              enableHighAccuracy: false, // Low accuracy for better success rate
              timeout: 30000,
              maximumAge: 60000 // Accept cached position up to 1 minute old
            };
            
            console.log('📍 GPS: Low accuracy options:', options);
            
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                console.log('📍 GPS: Low accuracy success!', pos);
                resolve(pos);
              },
              (error) => {
                console.log('📍 GPS: Low accuracy failed:', error);
                reject(error);
              },
              options
            );
          });
        } catch (lowAccuracyError: any) {
          console.log('📍 GPS: Low accuracy also failed:', lowAccuracyError);
          throw lowAccuracyError; // Throw the last error
        }
      }

      if (!position) {
        throw new Error('Failed to get location after trying all strategies');
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      console.log('📍 GPS: Coordinates captured - Lat:', lat, 'Lng:', lng, 'Accuracy:', accuracy, 'meters');
      
      // Update location state
      setLocation({ lat, lng });
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString()
      }));
      
      console.log('📍 GPS: Form data updated, looking up address...');
      
      // Look up address
      await lookupAddressFromCoordinates(lat, lng);
      
      console.log('📍 GPS: Location capture completed successfully!');
      
      // Show success message with accuracy info
      if (accuracy <= 10) {
        toast.success(`GPS location captured! Accuracy: ${Math.round(accuracy)}m`);
      } else if (accuracy <= 100) {
        toast.success(`GPS location captured! Accuracy: ${Math.round(accuracy)}m (Good)`);
      } else {
        toast.success(`GPS location captured! Accuracy: ${Math.round(accuracy)}m (Fair - consider moving outdoors)`);
      }
      
    } catch (error: any) {
      console.error('📍 GPS: Error in getCurrentLocation:', error);
      
      let errorMessage = 'Failed to get location. Please try again.';
      let userTip = '';
      
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location services and grant permission in your browser settings.';
        userTip = 'Go to browser settings → Privacy → Location → Allow';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. This usually means poor GPS signal or you\'re indoors.';
        userTip = 'Try moving outdoors, near a window, or wait a few minutes for GPS to acquire signal';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. GPS signal is weak.';
        userTip = 'Try moving outdoors or wait longer for GPS to acquire signal';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLocationError(`${errorMessage} ${userTip}`);
      toast.error(errorMessage);
      
      // Show specific mobile tips
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        toast.info('📱 Mobile Tip: Ensure Location Services are ON in your device settings');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const lookupAddressFromCoordinates = async (lat: number, lng: number) => {
    setGeocodingLoading(true);
    
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.display_name) {
        const address = data.display_name;
        const addressParts = data.address;
        
        const streetAddress = addressParts?.road ? 
          (addressParts.house_number ? `${addressParts.house_number}, ${addressParts.road}` : addressParts.road) : '';
        
        const city = addressParts?.city || addressParts?.town || addressParts?.village || '';
        const state = addressParts?.state || '';
        const postalCode = addressParts?.postcode || '';
        const wardNumber = addressParts?.['addr:postcode'] || '';
        const area = addressParts?.suburb || addressParts?.neighbourhood || '';
        
        setCapturedAddress(address);
        setFormData(prev => ({
          ...prev,
          address,
          street_address: streetAddress,
          city,
          state,
          postal_code: postalCode,
          ward_number_from_gps: wardNumber,
          area_from_gps: area
        }));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to lookup address from coordinates');
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleManualCoordinateEntry = () => {
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      lookupAddressFromCoordinates(lat, lng);
    }
  };


  // Photo capture functions
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const capturePhoto = async () => {
    try {
      setPhotoCapturing(true);
      toast.info('Opening camera... Please wait.');
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: isMobileDevice() ? 'environment' : 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.play();
        
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(true);
        });
        
        toast.info('Camera ready! Position the person in frame and click capture.');
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to data URL with 70% compression
          const photoDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setCapturedPhoto(photoDataUrl);
          
          stream.getTracks().forEach(track => track.stop());
          
          setPhotoDialogOpen(false);
          toast.success('Photo captured successfully from camera!');
        }
      } else {
        toast.info('Camera not supported. Opening file upload...');
        openFileInput();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Camera access denied. Please allow camera permissions or use file upload.');
          openFileInput();
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera found. Please use file upload.');
          openFileInput();
        } else {
          toast.error('Camera error. Please use file upload.');
          openFileInput();
        }
      } else {
        toast.error('Camera error. Please use file upload.');
        openFileInput();
      }
    } finally {
      setPhotoCapturing(false);
    }
  };

  const openFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    if (isMobileDevice()) {
      input.capture = 'environment';
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File too large. Please select an image under 10MB.');
          return;
        }
        
        if (!file.type.startsWith('image/')) {
          toast.error('Please select a valid image file.');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setCapturedPhoto(result);
          setPhotoDialogOpen(false);
          toast.success('Photo uploaded successfully!');
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const clearCapturedPhoto = () => {
    setCapturedPhoto(null);
    toast.info('Photo cleared. Please capture a new photo.');
  };

  // Sketch photo functions
  const closeSketchPhotoDialog = () => {
    setSketchPhotoDialogOpen(false);
  };

  const captureSketchPhoto = async () => {
    try {
      setSketchPhotoCapturing(true);
      toast.info('Opening camera for sketch... Please wait.');
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.play();
        
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(true);
        });
        
        toast.info('Camera ready! Position your sketch in frame and click capture.');
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to data URL with 70% compression
          const sketchDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setSketchPhoto(sketchDataUrl);
          
          // Create Base64ImageData object
          const base64Data: Base64ImageData = {
            data: sketchDataUrl.split(',')[1],
            type: "image/jpeg",
            size: sketchDataUrl.length
          };
          setSketchPhotoBase64(base64Data);
          
          stream.getTracks().forEach(track => track.stop());
          
          setSketchPhotoDialogOpen(false);
          toast.success('Sketch photo captured successfully!');
        }
      } else {
        toast.error('Camera not supported on this device.');
      }
    } catch (error) {
      console.error('Sketch camera error:', error);
      toast.error('Failed to open camera for sketch capture.');
    } finally {
      setSketchPhotoCapturing(false);
    }
  };

  const saveSketchPhoto = async (propertyId: string): Promise<string | null> => {
    if (!sketchPhotoBase64) return null;
    
    try {
      const response = await fetch(`/api/sketch-photo/${propertyId}/base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sketch_photo_base64: sketchPhotoBase64
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.uploadedPhotoPath;
      } else {
        throw new Error('Failed to save sketch photo');
      }
    } catch (error) {
      console.error('Error saving sketch photo:', error);
      return null;
    }
  };


  // Signature functions - Enhanced Implementation
  const openSignatureDialog = () => {
    setSignatureOpen(true);
    
    // Clear canvas and set up drawing context when dialog opens
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        console.log('✍️ Signature: Setting up canvas...');
        
        // Set canvas dimensions
        canvas.width = 400;
        canvas.height = 200;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear the canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Set default drawing style
          ctx.strokeStyle = '#000000'; // Black color
          ctx.lineWidth = 3; // Line thickness
          ctx.lineCap = 'round'; // Rounded line ends
          ctx.lineJoin = 'round'; // Rounded line joins
          
          console.log('✍️ Signature: Canvas setup complete');
        }
      }
    }, 100);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureData('');
    toast.info('Signature cleared.');
  };

  const clearSignatureFromForm = () => {
    setSignatureData('');
    toast.info('Signature cleared from form.');
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('✍️ Signature: Starting to draw...');
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set drawing style
        ctx.strokeStyle = '#000000'; // Black color
        ctx.lineWidth = 3; // Line thickness
        ctx.lineCap = 'round'; // Rounded line ends
        ctx.lineJoin = 'round'; // Rounded line joins
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('✍️ Signature: Starting at position:', x, y);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    console.log('✍️ Signature: Stopping drawing...');
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Check if anything was drawn
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some(pixel => pixel !== 0);
        
        if (!hasContent) {
          toast.error('Please draw a signature before saving');
          return;
        }
        
        const dataURL = canvas.toDataURL();
        setSignatureData(dataURL);
        setSignatureOpen(false);
        toast.success('Signature saved successfully!');
        console.log('✍️ Signature: Saved successfully');
      }
    }
  };

  // Touch events for mobile - Enhanced Implementation
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    console.log('✍️ Signature: Touch start');
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    console.log('✍️ Signature: Touch end');
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
  };

  // Property use management
  const addRoom = (roomType: keyof PropertyUseDetails) => {
    const newRoom: Room = {
      id: Date.now().toString(),
      length: 0,
      width: 0,
      area: 0
    };
    
    setPropertyUse(prev => ({
      ...prev,
      [roomType]: [...prev[roomType], newRoom]
    }));
  };

  const updateRoom = (roomType: keyof PropertyUseDetails, index: number, field: keyof Room, value: number) => {
    setPropertyUse(prev => {
      const updatedRooms = [...prev[roomType]];
      updatedRooms[index] = { ...updatedRooms[index], [field]: value };
      
      // Recalculate area
      if (field === 'length' || field === 'width') {
        updatedRooms[index].area = updatedRooms[index].length * updatedRooms[index].width;
      }
      
      return { ...prev, [roomType]: updatedRooms };
    });
  };

  const removeRoom = (roomType: keyof PropertyUseDetails, index: number) => {
    setPropertyUse(prev => ({
      ...prev,
      [roomType]: prev[roomType].filter((_, i) => i !== index)
    }));
  };


  // Stepper navigation
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleNext = () => {
    // Validation for specific steps
    if (activeStep === 0) {
      const errors = validateForm().filter(error => 
        ['Property Owner Name', 'Locality', 'Ward Number', 'Pincode', 'Zone'].includes(error)
      );
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error(`Please fill required fields: ${errors.join(', ')}`);
        return;
      }
      
      if (formData.aadhar_number && !validateAadhar(formData.aadhar_number)) {
        setValidationErrors(['Valid Aadhar Number (format: 1234-5678-9012)']);
        toast.error('Please enter a valid Aadhar number in format: 1234-5678-9012');
        return;
      }
    }
    
    if (activeStep === 2) {
      const errors = validateForm().filter(error => 
        ['Plot Area', 'Built-up Area', 'Carpet Area'].includes(error)
      );
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error(`Please fill required fields: ${errors.join(', ')}`);
        return;
      }
    }
    
    if (activeStep === 4) {
      if (!formData.latitude || !formData.longitude) {
        toast.error('Please capture GPS location before proceeding');
        return;
      }
      if (!capturedPhoto) {
        toast.error('Please capture owner/tenant photo before proceeding');
        return;
      }
      if (!signatureData) {
        toast.error('Please add digital signature before proceeding');
        return;
      }
    }
    
    if (activeStep === 5) {
      if (!sketchPhoto) {
        toast.error('Please capture a sketch photo before proceeding');
        return;
      }
    }
    
    // Clear validation errors when moving to next step
    setValidationErrors([]);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Form submission functions
  const saveDraft = async () => {
    setLoading(true);
    try {
      const apiData = {
        ...formData,
        ward_number: parseInt(formData.ward_number),
        construction_year: formData.construction_year ? parseInt(formData.construction_year) : null,
        plot_area: parseFloat(formData.plot_area),
        built_up_area: parseFloat(formData.built_up_area),
        carpet_area: parseFloat(formData.carpet_area),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        assessment_year: new Date().getFullYear(),
        property_use_details: propertyUse,
        signature_data: signatureData,
        owner_tenant_photo: capturedPhoto,
        property_type: formData.property_type as any,
        construction_type: formData.construction_type as any
      };

      await propertiesApi.createProperty(apiData);
      toast.success('Survey saved as draft successfully!');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const submitSurvey = async () => {
    setLoading(true);
    try {
      const validationErrors = validateForm();
      
      if (validationErrors.length > 0) {
        setValidationErrors(validationErrors);
        toast.error(`Please fill required fields: ${validationErrors.join(', ')}`);
        setLoading(false);
        return;
      }

      if (isEditMode && editingProperty && editingProperty.survey_status !== 'draft') {
        if (!formData.edit_comment || formData.edit_comment.trim() === '') {
          toast.error('Edit comment is required for post-submission edits');
          setLoading(false);
          return;
        }
      }

      const apiData = {
        ...formData,
        ward_number: parseInt(formData.ward_number),
        construction_year: formData.construction_year ? parseInt(formData.construction_year) : null,
        plot_area: parseFloat(formData.plot_area),
        built_up_area: parseFloat(formData.built_up_area),
        carpet_area: parseFloat(formData.carpet_area),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        assessment_year: new Date().getFullYear(),
        property_use_details: propertyUse,
        signature_data: signatureData,
        owner_tenant_photo: capturedPhoto,
        property_type: formData.property_type as any,
        construction_type: formData.construction_type as any
      };

      let response;
      
      if (isEditMode && editingProperty) {
        response = await propertiesApi.updateProperty(editingProperty.id, apiData);
        toast.success(`Property survey updated successfully! Survey ID: ${formData.survey_number}`);
        
        if (sketchPhotoBase64) {
          console.log('📤 Starting sketch photo save for property:', editingProperty.id);
          const uploadedPhotoPath = await saveSketchPhoto(editingProperty.id);
          if (uploadedPhotoPath) {
            console.log('✅ Sketch photo uploaded successfully via Base64 endpoint');
          } else {
            console.warn('⚠️ Sketch photo upload failed, but continuing with property update');
            toast.warning('Sketch photo upload failed, but property was updated successfully.');
          }
        }
        
        try {
          const submitResponse = await propertiesApi.submitProperty(editingProperty.id);
          console.log('✅ Property submitted successfully:', submitResponse);
          toast.success(`Property survey submitted for review successfully! Survey ID: ${formData.survey_number}`);
        } catch (submitError: any) {
          console.error('❌ Error submitting property:', submitError);
          toast.error(`Failed to submit survey: ${submitError.response?.data?.message || 'Unknown error'}`);
        }
        
        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        response = await propertiesApi.createProperty(apiData);
        
        if (response.data && response.data.property && response.data.property.id) {
          if (sketchPhotoBase64) {
            console.log('📤 Starting sketch photo save for new property:', response.data.property.id);
            const uploadedPhotoPath = await saveSketchPhoto(response.data.property.id);
            if (uploadedPhotoPath) {
              console.log('✅ Sketch photo uploaded successfully via Base64 endpoint');
            } else {
              console.warn('⚠️ Sketch photo upload failed for new property, but property was created successfully');
              toast.warning('Sketch photo upload failed, but property was created successfully.');
            }
          }
          
          await propertiesApi.submitProperty(response.data.property.id);
          toast.success(`Property survey submitted successfully! Survey ID: ${formData.survey_number}`);
        }
        
        // Reset form for new surveys
        setFormData({
          survey_number: `SUR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
          old_mc_property_number: '',
          register_no: '',
          owner_name: '',
          owner_father_name: '',
          owner_phone: '',
          owner_email: '',
          aadhar_number: '',
          house_number: '',
          street_name: '',
          locality: '',
          ward_number: '',
          pincode: '',
          zone: 'A',
          property_type: '',
          construction_type: '',
          construction_year: '',
          number_of_floors: 1,
          building_permission: false,
          bp_number: '',
          bp_date: '',
          plot_area: '',
          built_up_area: '',
          carpet_area: '',
          water_connection: 0,
          water_connection_number: '',
          water_connection_date: '',
          electricity_connection: false,
          electricity_connection_number: '',
          sewage_connection: false,
          solar_panel: false,
          rain_water_harvesting: false,
          latitude: '',
          longitude: '',
          address: '',
          street_address: '',
          city: '',
          state: '',
          postal_code: '',
          ward_number_from_gps: '',
          area_from_gps: '',
          remarks: '',
          edit_comment: ''
        });
        setPropertyUse({
          halls: [],
          bedrooms: [],
          kitchens: [],
          shops: [],
          bathrooms: []
        });
        setSignatureData('');
        setCapturedPhoto(null);
        setSketchPhoto(null);
        setSketchPhotoBase64(null);
        setActiveStep(0);
      }
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit survey: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };


  const renderPropertyUseSection = () => {
    const roomTypes: { key: keyof PropertyUseDetails; label: string }[] = [
      { key: 'halls', label: 'Hall' },
      { key: 'bedrooms', label: 'Bedroom' },
      { key: 'kitchens', label: 'Kitchen' },
      { key: 'shops', label: 'Shop' },
      { key: 'bathrooms', label: 'Bathroom' }
    ];

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          📐 Property Use Calculator
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Add rooms and calculate individual areas. Length × Width = Area will be calculated automatically.
        </Alert>
        
        {roomTypes.map(({ key, label }) => (
          <Card key={key} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{label}s ({propertyUse[key].length})</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => addRoom(key)}
                  size="small"
                >
                  Add {label}
                </Button>
              </Box>
              
              {propertyUse[key].length > 0 && (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>Length (ft)</TableCell>
                        <TableCell>Width (ft)</TableCell>
                        <TableCell>Area (sq ft)</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {propertyUse[key].map((room, index) => (
                        <TableRow key={room.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={room.length}
                              onChange={(e) => updateRoom(key, index, 'length', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.1 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={room.width}
                              onChange={(e) => updateRoom(key, index, 'width', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.1 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {room.area.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeRoom(key, index)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3}><strong>Total {label} Area:</strong></TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {propertyUse[key].reduce((sum, room) => sum + room.area, 0).toFixed(1)} sq ft
                          </Typography>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        ))}
        
        <Alert severity="success">
          <Typography variant="h6">
            Total Calculated Area: {
              Object.values(propertyUse).flat().reduce((sum, room) => sum + room.area, 0).toFixed(1)
            } sq ft
          </Typography>
        </Alert>
      </Box>
    );
  };


  // Function to render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Basic Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Survey Number *"
                value={formData.survey_number}
                onChange={(e) => handleInputChange('survey_number', e.target.value)}
                placeholder="e.g., SUR-2024-001"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Old M.C Property Number"
                value={formData.old_mc_property_number}
                onChange={(e) => handleInputChange('old_mc_property_number', e.target.value)}
                placeholder="Previous municipal property ID"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Register Number"
                value={formData.register_no}
                onChange={(e) => handleInputChange('register_no', e.target.value)}
                placeholder="Property register number"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Owner Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Property Owner Name *"
                value={formData.owner_name}
                onChange={(e) => handleInputChange('owner_name', e.target.value)}
                placeholder="Full name of property owner"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's Name"
                value={formData.owner_father_name}
                onChange={(e) => handleInputChange('owner_father_name', e.target.value)}
                placeholder="Father's full name"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.owner_phone}
                onChange={(e) => handleInputChange('owner_phone', e.target.value)}
                placeholder="+91 9876543210"
                inputProps={{ maxLength: 15 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.owner_email}
                onChange={(e) => handleInputChange('owner_email', e.target.value)}
                placeholder="owner@example.com"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Aadhar Number (12 digits)"
                value={formData.aadhar_number}
                onChange={(e) => handleAadharChange(e.target.value)}
                placeholder="1234-5678-9012"
                inputProps={{ maxLength: 14 }}
                helperText="Format: 1234-5678-9012"
                error={!!(formData.aadhar_number && !validateAadhar(formData.aadhar_number))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Property Address
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="House Number"
                value={formData.house_number}
                onChange={(e) => handleInputChange('house_number', e.target.value)}
                placeholder="123, A-1"
              />
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Street Name"
                value={formData.street_name}
                onChange={(e) => handleInputChange('street_name', e.target.value)}
                placeholder="MG Road, Shivaji Nagar"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Locality *"
                value={formData.locality}
                onChange={(e) => handleInputChange('locality', e.target.value)}
                placeholder="Area/Locality name"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Ward Number *"
                type="number"
                value={formData.ward_number}
                onChange={(e) => handleInputChange('ward_number', e.target.value)}
                placeholder="1-50"
                required
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Pincode *"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                placeholder="411001"
                required
                inputProps={{ maxLength: 6 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth required>
                <InputLabel>Zone *</InputLabel>
                <Select
                  value={formData.zone}
                  onChange={(e) => handleInputChange('zone', e.target.value)}
                >
                  <MenuItem value="A">Zone A</MenuItem>
                  <MenuItem value="B">Zone B</MenuItem>
                  <MenuItem value="C">Zone C</MenuItem>
                  <MenuItem value="D">Zone D</MenuItem>
                  <MenuItem value="E">Zone E</MenuItem>
                  <MenuItem value="F">Zone F</MenuItem>
                  <MenuItem value="G">Zone G</MenuItem>
                  <MenuItem value="H">Zone H</MenuItem>
                  <MenuItem value="I">Zone I</MenuItem>
                  <MenuItem value="J">Zone J</MenuItem>
                  <MenuItem value="K">Zone K</MenuItem>
                  <MenuItem value="L">Zone L</MenuItem>
                  <MenuItem value="M">Zone M</MenuItem>
                  <MenuItem value="N">Zone N</MenuItem>
                  <MenuItem value="O">Zone O</MenuItem>
                  <MenuItem value="P">Zone P</MenuItem>
                  <MenuItem value="Q">Zone Q</MenuItem>
                  <MenuItem value="R">Zone R</MenuItem>
                  <MenuItem value="S">Zone S</MenuItem>
                  <MenuItem value="T">Zone T</MenuItem>
                  <MenuItem value="U">Zone U</MenuItem>
                  <MenuItem value="V">Zone V</MenuItem>
                  <MenuItem value="W">Zone W</MenuItem>
                  <MenuItem value="X">Zone X</MenuItem>
                  <MenuItem value="Y">Zone Y</MenuItem>
                  <MenuItem value="Z">Zone Z</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );


      case 1: // Property Details & Permissions
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
                Property Details & Permissions
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Property Type *</InputLabel>
                <Select
                  value={formData.property_type}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                  <MenuItem value="industrial">Industrial</MenuItem>
                  <MenuItem value="mixed">Mixed Use</MenuItem>
                  <MenuItem value="institutional">Institutional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Construction Type *</InputLabel>
                <Select
                  value={formData.construction_type}
                  onChange={(e) => handleInputChange('construction_type', e.target.value)}
                >
                  <MenuItem value="rcc">R.C.C (Reinforced Cement Concrete)</MenuItem>
                  <MenuItem value="load_bearing">Load Bearing</MenuItem>
                  <MenuItem value="tin_patra">Tin Patra</MenuItem>
                  <MenuItem value="kaccha">Kaccha</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Construction Year"
                type="number"
                value={formData.construction_year}
                onChange={(e) => handleInputChange('construction_year', e.target.value)}
                placeholder="2015"
                inputProps={{ min: 1900, max: new Date().getFullYear() }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Floors"
                type="number"
                value={formData.number_of_floors}
                onChange={(e) => handleInputChange('number_of_floors', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Building Permission Details
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Building Permission</FormLabel>
                <RadioGroup
                  value={formData.building_permission ? 'yes' : 'no'}
                  onChange={(e) => handleInputChange('building_permission', e.target.value === 'yes')}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {formData.building_permission && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="B.P Number"
                    value={formData.bp_number}
                    onChange={(e) => handleInputChange('bp_number', e.target.value)}
                    placeholder="Building permission number"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="B.P Date"
                    type="date"
                    value={formData.bp_date}
                    onChange={(e) => handleInputChange('bp_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        );


      case 2: // Area Measurements & Property Use
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📏 Area Measurements
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                All measurements should be in square feet. Ensure accuracy as this affects tax calculation.
              </Alert>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Plot Area (sq ft) *"
                type="number"
                value={formData.plot_area}
                onChange={(e) => handleInputChange('plot_area', e.target.value)}
                placeholder="1200"
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Built-up Area (sq ft) *"
                type="number"
                value={formData.built_up_area}
                onChange={(e) => handleInputChange('built_up_area', e.target.value)}
                placeholder="1000"
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Carpet Area (sq ft) *"
                type="number"
                value={formData.carpet_area}
                onChange={(e) => handleInputChange('carpet_area', e.target.value)}
                placeholder="850"
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
              {renderPropertyUseSection()}
            </Grid>
          </Grid>
        );

      case 3: // Utilities & Connections
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🔌 Utility Connections
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Water Connection
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Water Connection Type</InputLabel>
                        <Select
                          value={formData.water_connection}
                          onChange={(e) => handleInputChange('water_connection', e.target.value)}
                        >
                          <MenuItem value={0}>No Connection</MenuItem>
                          <MenuItem value={1}>Single Connection</MenuItem>
                          <MenuItem value={2}>Double Connection</MenuItem>
                          <MenuItem value={3}>Triple Connection</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {formData.water_connection > 0 && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Water Connection Number"
                            value={formData.water_connection_number}
                            onChange={(e) => handleInputChange('water_connection_number', e.target.value)}
                            placeholder="WC123456"
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Connection Date"
                            type="date"
                            value={formData.water_connection_date}
                            onChange={(e) => handleInputChange('water_connection_date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.electricity_connection}
                    onChange={(e) => handleInputChange('electricity_connection', e.target.checked)}
                  />
                }
                label="Electricity Connection"
              />
              {formData.electricity_connection && (
                <TextField
                  fullWidth
                  label="Electricity Connection Number"
                  value={formData.electricity_connection_number}
                  onChange={(e) => handleInputChange('electricity_connection_number', e.target.value)}
                  placeholder="EC123456"
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.sewage_connection}
                    onChange={(e) => handleInputChange('sewage_connection', e.target.checked)}
                  />
                }
                label="Sewage Connection"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.solar_panel}
                    onChange={(e) => handleInputChange('solar_panel', e.target.checked)}
                  />
                }
                label="Solar Panel"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rain_water_harvesting}
                    onChange={(e) => handleInputChange('rain_water_harvesting', e.target.checked)}
                  />
                }
                label="Rain Water Harvesting"
              />
            </Grid>
          </Grid>
        );


      case 4: // Location, Photos & Signature
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                Location, Photos & Signature
              </Typography>
            </Grid>
            
            {/* GPS Location */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📍 GPS Location & Address
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      placeholder="18.5204"
                      disabled={locationLoading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      placeholder="73.8567"
                      disabled={locationLoading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      startIcon={<LocationOn />}
                      onClick={getCurrentLocation}
                      fullWidth
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Capturing...
                        </>
                      ) : (
                        '📍 Capture GPS Location'
                      )}
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={handleManualCoordinateEntry}
                      fullWidth
                      disabled={geocodingLoading || !formData.latitude || !formData.longitude}
                    >
                      {geocodingLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Looking up...
                        </>
                      ) : (
                        '🔍 Lookup Address'
                      )}
                    </Button>
                  </Grid>
                  
                  {/* Debug Button */}
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        console.log('📍 GPS Debug Info:');
                        console.log('- navigator.geolocation:', !!navigator.geolocation);
                        console.log('- Current form data:', formData);
                        console.log('- Location state:', location);
                        console.log('- Location loading:', locationLoading);
                        console.log('- Location error:', locationError);
                        toast.info('GPS debug info logged to console. Press F12 to view.');
                      }}
                      fullWidth
                    >
                      🐛 Debug GPS
                    </Button>
                  </Grid>
                  
                  {/* Manual GPS Input */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      📍 Manual GPS Input (if automatic fails)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Manual Latitude"
                          value={formData.latitude}
                          onChange={(e) => handleInputChange('latitude', e.target.value)}
                          placeholder="18.5204"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Manual Longitude"
                          value={formData.longitude}
                          onChange={(e) => handleInputChange('longitude', e.target.value)}
                          placeholder="73.8567"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleManualCoordinateEntry}
                          disabled={!formData.latitude || !formData.longitude}
                          fullWidth
                          sx={{ height: '40px' }}
                        >
                          🔍 Lookup Address
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                
                {/* Location Status */}
                {locationLoading && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      📡 Acquiring GPS signal... Please wait (may take 30 seconds)
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Ensure you're outdoors with clear sky view for best accuracy
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      <strong>Mobile Tip:</strong> Make sure location services are enabled in your device settings
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      <strong>Browser Tip:</strong> Check browser console (F12) for detailed GPS logs
                    </Typography>
                  </Alert>
                )}
                
                {geocodingLoading && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      🔍 Looking up address from coordinates...
                    </Typography>
                  </Alert>
                )}
                
                {location && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>✅ GPS Location Captured Successfully!</strong>
                    </Typography>
                    <Typography variant="body2">
                      Latitude: {location.lat.toFixed(6)}, Longitude: {location.lng.toFixed(6)}
                    </Typography>
                    {capturedAddress && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Address: {capturedAddress}
                      </Typography>
                    )}
                  </Alert>
                )}
                
                {/* Error Display */}
                {locationError && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>⚠️ Location Error:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {locationError}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      You can still enter coordinates and address manually
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      <strong>Troubleshooting:</strong> Check browser console (F12) for detailed error logs
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </Grid>
            
            {/* Photo Capture */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📸 Owner/Tenant Photo
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      startIcon={photoCapturing ? <CircularProgress size={20} /> : <PhotoCamera />}
                      onClick={() => setPhotoDialogOpen(true)}
                      disabled={photoCapturing}
                      fullWidth
                      sx={{ p: 3 }}
                    >
                      {capturedPhoto ? '📸 Retake Owner Photo' : '📸 Capture Owner Photo'}
                    </Button>
                  </Grid>
                  
                  {capturedPhoto && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <img 
                          src={capturedPhoto} 
                          alt="Captured" 
                          style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                        />
                        <Typography variant="caption" display="block">
                          Photo captured successfully
                        </Typography>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Clear />}
                          onClick={clearCapturedPhoto}
                          sx={{ mt: 1 }}
                        >
                          Clear Photo
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
                
                {capturedPhoto && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>✅ Owner/Tenant Photo Captured Successfully!</strong>
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      The photo will be included in your survey submission. You can retake it anytime.
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </Grid>
            
            {/* Signature */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ✍️ Digital Signature
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={openSignatureDialog}
                  sx={{ mb: 2 }}
                >
                  {signatureData ? '✍️ Edit Signature' : '✍️ Add Signature'}
                </Button>
                
                {signatureData && (
                  <Box sx={{ textAlign: 'center' }}>
                    <img 
                      src={signatureData} 
                      alt="Signature" 
                      style={{ border: '1px solid #ccc', maxWidth: '300px' }}
                    />
                    <Typography variant="caption" display="block">
                      Signature captured
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Clear />}
                      onClick={clearSignature}
                      sx={{ mt: 1 }}
                    >
                      Clear Signature
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Remarks"
                multiline
                rows={4}
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="Any additional observations or notes about the property..."
              />
            </Grid>
          </Grid>
        );


      case 5: // Sketch Photo Capture
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🏠 Sketch Photo Capture
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Capture a photo of your property sketch or drawing. This helps in property identification and assessment.
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📸 Sketch Photo
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      startIcon={sketchPhotoCapturing ? <CircularProgress size={20} /> : <PhotoCamera />}
                      onClick={() => setSketchPhotoDialogOpen(true)}
                      disabled={sketchPhotoCapturing}
                      fullWidth
                      sx={{ p: 3 }}
                    >
                      {sketchPhoto ? '📸 Retake Sketch Photo' : '📸 Capture Sketch Photo'}
                    </Button>
                  </Grid>
                  
                  {sketchPhoto && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <img 
                          src={sketchPhoto} 
                          alt="Sketch" 
                          style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                        />
                        <Typography variant="caption" display="block">
                          Sketch photo captured successfully
                        </Typography>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Clear />}
                          onClick={() => {
                            setSketchPhoto(null);
                            setSketchPhotoBase64(null);
                          }}
                          sx={{ mt: 1 }}
                        >
                          Clear Photo
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
                
                {sketchPhoto && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>✅ Sketch Photo Captured Successfully!</strong>
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      The sketch photo will be included in your survey submission. You can retake it anytime.
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        );

      case 6: // Review & Submit
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📋 Review & Submit
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please review all the information before submitting. Once submitted, the survey will be sent for review.
              </Alert>
            </Grid>
            
            {/* Summary Cards */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    �� Basic Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Survey Number:</strong> {formData.survey_number}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Owner Name:</strong> {formData.owner_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Address:</strong> {formData.house_number} {formData.street_name}, {formData.locality}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Ward:</strong> {formData.ward_number} | <strong>Zone:</strong> {formData.zone}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🏠 Property Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {formData.property_type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Construction:</strong> {formData.construction_type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Floors:</strong> {formData.number_of_floors}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Plot Area:</strong> {formData.plot_area} sq ft
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📍 Location & Media
                  </Typography>
                  <Typography variant="body2">
                    <strong>GPS:</strong> {formData.latitude}, {formData.longitude}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Photo:</strong> {capturedPhoto ? '✅ Captured' : '❌ Missing'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Signature:</strong> {signatureData ? '✅ Captured' : '❌ Missing'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Sketch:</strong> {sketchPhoto ? '✅ Captured' : '❌ Missing'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔌 Utilities
                  </Typography>
                  <Typography variant="body2">
                    <strong>Water:</strong> {formData.water_connection > 0 ? `${formData.water_connection} connection(s)` : 'No connection'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Electricity:</strong> {formData.electricity_connection ? '✅ Connected' : '❌ Not connected'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Sewage:</strong> {formData.sewage_connection ? '✅ Connected' : '❌ Not connected'}
                  </Typography>
                </CardContent>
              </Card>
            
            {/* Edit Comment for Edit Mode */}
            {isEditMode && editingProperty && editingProperty.survey_status !== 'draft' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Edit Comment *"
                  multiline
                  rows={3}
                  value={formData.edit_comment}
                  onChange={(e) => handleInputChange('edit_comment', e.target.value)}
                  placeholder="Please provide a reason for editing this survey..."
                  required
                  helperText="Edit comment is required for post-submission edits"
                />
              </Grid>
            )}
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="error">
                  <Typography variant="body2" gutterBottom>
                    <strong>Please fix the following issues:</strong>
                  </Typography>
                  <ul>
                    {validationErrors.map((error, index) => (
                      <li key={index}>
                        <Typography variant="body2">{error}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              </Grid>
            )}
          </Grid>
        </Grid>
        );

      default:
        return null;
    }
  };


  // Main return statement
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            {isEditMode ? '✏️ Edit Property Survey' : '🏠 New Property Survey'}
          </Typography>
          
          {isEditMode && editingProperty && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Editing Survey:</strong> {editingProperty.survey_number} | 
                Status: {editingProperty.survey_status} | 
                Created: {new Date(editingProperty.created_at).toLocaleDateString()}
              </Typography>
            </Alert>
          )}
          
          {/* Stepper */}
          <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Step Content */}
          <Box sx={{ mb: 4 }}>
            {renderStepContent(activeStep)}
          </Box>
          
          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={saveDraft}
                    disabled={loading}
                    sx={{ mr: 1 }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Save Draft'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={submitSurvey}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                  >
                    {loading ? 'Submitting...' : 'Submit Survey'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  startIcon={<Save />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Photo Capture Dialog */}
      <Dialog 
        open={photoDialogOpen} 
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📸 Capture Owner/Tenant Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" gutterBottom>
              Choose how you want to capture the photo:
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  startIcon={<PhotoCamera />}
                  onClick={capturePhoto}
                  disabled={photoCapturing}
                  fullWidth
                  sx={{ p: 2 }}
                >
                  {photoCapturing ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Opening Camera...
                    </>
                  ) : (
                    '📸 Use Camera'
                  )}
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={openFileInput}
                  fullWidth
                  sx={{ p: 2 }}
                >
                  📁 Upload File
                </Button>
              </Grid>
            </Grid>
            
            {photoCapturing && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Opening camera... Please wait and grant camera permissions when prompted.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Sketch Photo Dialog */}
      <Dialog 
        open={sketchPhotoDialogOpen} 
        onClose={closeSketchPhotoDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          🏠 Capture Sketch Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" gutterBottom>
              Position your sketch or drawing in front of the camera:
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<PhotoCamera />}
              onClick={captureSketchPhoto}
              disabled={sketchPhotoCapturing}
              fullWidth
              sx={{ p: 2, mt: 2 }}
            >
              {sketchPhotoCapturing ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Opening Camera...
                </>
              ) : (
                '📸 Capture Sketch Photo'
              )}
            </Button>
            
            {sketchPhotoCapturing && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Opening camera... Please wait and grant camera permissions when prompted.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSketchPhotoDialog}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Signature Dialog */}
      <Dialog 
        open={signatureOpen} 
        onClose={() => setSignatureOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ✍️ Digital Signature
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body2" gutterBottom>
              Draw your signature below:
            </Typography>
            
            <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 2 }}>
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                style={{ border: '1px solid #ddd', cursor: 'crosshair' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={clearSignatureFromForm}
                startIcon={<Clear />}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={saveSignature}
                startIcon={<Save />}
              >
                Save Signature
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertySurveyForm;
