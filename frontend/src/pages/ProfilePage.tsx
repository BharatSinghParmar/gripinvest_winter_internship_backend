import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  Save,
  Person,
  Security,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { User } from '../types'

// Validation schemas
const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  risk_appetite: z.enum(['low', 'moderate', 'high']),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      risk_appetite: user?.risk_appetite || 'moderate',
    },
  })

  // Password form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const handleProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    try {
      const response = await apiService.updateProfile(data)
      if (response.success) {
        updateUser(response.data as User)
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' })
      } else {
        setSnackbar({ open: true, message: response.message || 'Failed to update profile', severity: 'error' })
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to update profile', severity: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true)
    try {
      const response = await apiService.changePassword(data.currentPassword, data.newPassword)
      if (response.success) {
        setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' })
        passwordForm.reset()
      } else {
        setSnackbar({ open: true, message: response.message || 'Failed to change password', severity: 'error' })
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to change password', severity: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your account information and preferences
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Person />} label="Personal Information" />
          <Tab icon={<Security />} label="Security" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {activeTab === 0 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Person sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Personal Information
                  </Typography>
                </Box>

                <Box component="form" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="first_name"
                        control={profileForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="First Name"
                            variant="outlined"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="last_name"
                        control={profileForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Last Name"
                            variant="outlined"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={user?.email || ''}
                        variant="outlined"
                        disabled
                        helperText="Email cannot be changed"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="risk_appetite"
                        control={profileForm.control}
                        render={({ field, fieldState }) => (
                          <FormControl fullWidth error={!!fieldState.error}>
                            <InputLabel>Risk Appetite</InputLabel>
                            <Select
                              {...field}
                              label="Risk Appetite"
                            >
                              <MenuItem value="low">Low Risk</MenuItem>
                              <MenuItem value="moderate">Moderate Risk</MenuItem>
                              <MenuItem value="high">High Risk</MenuItem>
                            </Select>
                            {fieldState.error && (
                              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                                {fieldState.error.message}
                              </Typography>
                            )}
                          </FormControl>
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={20} /> : 'Save Changes'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Security sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Change Password
                  </Typography>
                </Box>

                <Box component="form" onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="currentPassword"
                        control={passwordForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Current Password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            variant="outlined"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    edge="end"
                                  >
                                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="newPassword"
                        control={passwordForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="New Password"
                            type={showNewPassword ? 'text' : 'password'}
                            variant="outlined"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    edge="end"
                                  >
                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="confirmPassword"
                        control={passwordForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            variant="outlined"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    edge="end"
                                  >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Security />}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={20} /> : 'Change Password'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Account Type
                </Typography>
                <Typography variant="body1">
                  {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
