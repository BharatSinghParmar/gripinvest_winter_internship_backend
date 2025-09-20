import React, { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Email,
  ArrowBack,
} from '@mui/icons-material'
import { apiService } from '../../services/api'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.requestPasswordReset(data.email)
      if (response.success) {
        setIsSuccess(true)
      } else {
        setError(response.message || 'Failed to send reset email')
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many OTP requests. Please wait 15 minutes before requesting another OTP.')
      } else {
        setError(err.response?.data?.message || 'Failed to send reset email')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 400 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Email sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography component="h1" variant="h4" gutterBottom>
                Check Your Email
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We've sent a password reset OTP to your email address. 
                Please check your inbox and follow the instructions to reset your password.
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Development Note:</strong> Check the backend console for the OTP code.
                </Typography>
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/auth/reset-password"
                  fullWidth
                >
                  Enter OTP Code
                </Button>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/login"
                  startIcon={<ArrowBack />}
                  fullWidth
                >
                  Back to Login
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Email sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography component="h1" variant="h4" gutterBottom>
                Forgot Password?
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Enter your email address and we'll send you an OTP to reset your password
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                {...register('email')}
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isLoading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <Email />}
              >
                {isLoading ? 'Sending OTP...' : 'Send Reset OTP'}
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component={RouterLink}
                  to="/login"
                  variant="body2"
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
                >
                  <ArrowBack fontSize="small" />
                  Back to Login
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
