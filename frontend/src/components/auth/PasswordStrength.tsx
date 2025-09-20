import React from 'react'
import { Box, Typography, LinearProgress, Chip } from '@mui/material'
import { CheckCircle, Cancel } from '@mui/icons-material'
import type { PasswordStrength as PasswordStrengthType } from '../../types'

interface PasswordStrengthProps {
  strength: PasswordStrengthType | null
  isLoading?: boolean
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ 
  strength, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Box sx={{ mt: 1, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Analyzing password strength...
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  if (!strength) {
    return null
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
    <Box sx={{ mt: 1, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Password Strength:
        </Typography>
        <Chip
          label={strength.level}
          size="small"
          color={getStrengthColor(strength.level) as any}
        />
        <Typography variant="body2" color="text.secondary">
          ({strength.score}/100)
        </Typography>
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={strength.score}
        color={getStrengthColor(strength.level) as any}
        sx={{ mb: 1 }}
      />

      {strength.requirements && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {Object.entries(strength.requirements).map(([key, met]) => (
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

      {strength.suggestions && strength.suggestions.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Suggestions:
          </Typography>
          {strength.suggestions.map((suggestion: string, index: number) => (
            <Typography key={index} variant="caption" color="text.secondary" display="block">
              • {suggestion}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  )
}
