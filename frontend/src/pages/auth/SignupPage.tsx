import React, { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
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
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  CheckCircle,
  Cancel,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
// import { PasswordStrength } from '../../components/auth/PasswordStrength'
import { apiService } from '../../services/api'

const signupSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  last_name: z.string().max(100, 'Last name too long').optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  risk_appetite: z.enum(['low', 'moderate', 'high']),
})

type SignupForm = z.infer<typeof signupSchema>

export const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<any>(null)
  const [checkingStrength, setCheckingStrength] = useState(false)
  const { signup, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()


  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      risk_appetite: 'moderate',
    },
  })

  const watchedPassword = watch('password')

  const checkPasswordStrength = async (password: string) => {
    if (!password || password.length < 3) {
      setPasswordStrength(null)
      return
    }

    setCheckingStrength(true)
    try {
      const response = await apiService.checkPasswordStrength(password)
      if (response.success) {
        setPasswordStrength(response.data)
      }
    } catch (err) {
      // Ignore password strength check errors
    } finally {
      setCheckingStrength(false)
    }
  }

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedPassword) {
        checkPasswordStrength(watchedPassword)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [watchedPassword])

  const onSubmit = async (data: SignupForm) => {
    clearError()
    try {
      await signup(data)
      navigate('/app/dashboard')
    } catch (err) {
      // Error is handled by the auth context
    }
  }

  const handleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'weak':
        return 'error'
      case 'fair':
        return 'warning'
      case 'good':
        return 'info'
      case 'strong':
      case 'very-strong':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <PersonAdd sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography component="h1" variant="h4" gutterBottom>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Join GripInvest and start your investment journey
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  {...register('first_name')}
                  required
                  fullWidth
                  id="first_name"
                  label="First Name"
                  name="first_name"
                  autoComplete="given-name"
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                  disabled={isLoading}
                />
                <TextField
                  {...register('last_name')}
                  fullWidth
                  id="last_name"
                  label="Last Name"
                  name="last_name"
                  autoComplete="family-name"
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                  disabled={isLoading}
                />
              </Box>

              <TextField
                {...register('email')}
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isLoading}
              />

              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.risk_appetite}
                disabled={isLoading}
              >
                <InputLabel id="risk-appetite-label">Risk Appetite</InputLabel>
                <Select
                  {...register('risk_appetite')}
                  labelId="risk-appetite-label"
                  id="risk_appetite"
                  label="Risk Appetite"
                  defaultValue="moderate"
                >
                  <MenuItem value="low">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Low" size="small" color="success" />
                      <Typography variant="body2">Conservative - Lower risk, stable returns</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="moderate">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Moderate" size="small" color="warning" />
                      <Typography variant="body2">Balanced - Moderate risk and returns</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="high">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="High" size="small" color="error" />
                      <Typography variant="body2">Aggressive - Higher risk, potential for higher returns</Typography>
                    </Box>
                  </MenuItem>
                </Select>
                {errors.risk_appetite && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {errors.risk_appetite.message}
                  </Typography>
                )}
              </FormControl>

              <TextField
                {...register('password')}
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleShowPassword}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {passwordStrength && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Password Strength:
                    </Typography>
                    <Chip
                      label={passwordStrength.level}
                      size="small"
                      color={getStrengthColor(passwordStrength.level) as any}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({passwordStrength.score}/100)
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.score}
                    color={getStrengthColor(passwordStrength.level) as any}
                    sx={{ mb: 1 }}
                  />

                  {passwordStrength.requirements && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                        <Chip
                          key={key}
                          icon={met ? <CheckCircle /> : <Cancel />}
                          label={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          size="small"
                          color={met ? 'success' : 'default'}
                          variant={met ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  )}

                  {passwordStrength.suggestions && passwordStrength.suggestions.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Suggestions:
                      </Typography>
                      {passwordStrength.suggestions.map((suggestion: string, index: number) => (
                        <Typography key={index} variant="caption" color="text.secondary" display="block">
                          • {suggestion}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {checkingStrength && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Analyzing password strength...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading || checkingStrength}
                startIcon={isLoading ? <CircularProgress size={20} /> : <PersonAdd />}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login" variant="body2">
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
