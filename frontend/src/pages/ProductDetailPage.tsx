import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material'
import {
  ArrowBack,
  TrendingUp,
  Schedule,
  AccountBalance,
} from '@mui/icons-material'
import { apiService } from '../services/api'
import type { Product } from '../types'

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [investmentAmountError, setInvestmentAmountError] = useState('')
  const [isCreatingInvestment, setIsCreatingInvestment] = useState(false)

  // Fetch product details
  const { data: productResponse, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiService.getProduct(id!),
    enabled: !!id,
  })

  const product = productResponse?.data as Product | undefined

  const handleInvestNow = () => {
    setInvestmentDialogOpen(true)
  }

  const handleCloseInvestmentDialog = () => {
    setInvestmentDialogOpen(false)
    setInvestmentAmount('')
    setInvestmentAmountError('')
    setIsCreatingInvestment(false)
  }

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInvestmentAmount(value)
    
    // Basic validation
    const amount = parseFloat(value)
    if (value && (isNaN(amount) || amount <= 0)) {
      setInvestmentAmountError('Please enter a valid amount')
    } else if (product && amount < product.min_investment) {
      setInvestmentAmountError(`Minimum investment is ₹${product.min_investment.toLocaleString()}`)
    } else if (product && product.max_investment && amount > product.max_investment) {
      setInvestmentAmountError(`Maximum investment is ₹${product.max_investment.toLocaleString()}`)
    } else {
      setInvestmentAmountError('')
    }
  }

  const handleSubmitInvestment = async () => {
    if (!product || !investmentAmount || investmentAmountError || isCreatingInvestment) return

    setIsCreatingInvestment(true)
    try {
      const response = await apiService.createInvestment({
        product_id: product.id,
        amount: parseFloat(investmentAmount)
      })

      if (response.success) {
        // Show success message
        alert('Investment created successfully! You can view it in your portfolio.')
        handleCloseInvestmentDialog()
        // Optionally navigate to investments page
        // navigate('/app/investments')
      } else {
        throw new Error(response.message || 'Failed to create investment')
      }
    } catch (error: any) {
      console.error('Failed to create investment:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create investment. Please try again.'
      alert(errorMessage)
    } finally {
      setIsCreatingInvestment(false)
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error || !product) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/app/products')}
            sx={{ mr: 2 }}
          >
            Back to Products
          </Button>
        </Box>
        <Alert severity="error">
          Failed to load product details. Please try again.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/app/products')}
          sx={{ mr: 2 }}
        >
          Back to Products
        </Button>
        <Typography variant="h4">
          {product.name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {product.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip label={product.investment_type.toUpperCase()} color="primary" />
                <Chip 
                  label={`${product.risk_level.charAt(0).toUpperCase() + product.risk_level.slice(1)} Risk`} 
                  color={product.risk_level === 'low' ? 'success' : product.risk_level === 'moderate' ? 'warning' : 'error'} 
                />
                <Chip label={product.is_active ? 'Active' : 'Inactive'} color={product.is_active ? 'info' : 'default'} />
              </Box>
              
              <Typography variant="body1" sx={{ mb: 3 }}>
                {product.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp sx={{ mr: 2, color: 'success.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Annual Yield
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {product.annual_yield}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule sx={{ mr: 2, color: 'info.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tenure
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {product.tenure_months} Months
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountBalance sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Min Investment
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        ₹{product.min_investment.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                {product.max_investment && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccountBalance sx={{ mr: 2, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Max Investment
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          ₹{product.max_investment.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Investment Calculator
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Calculate your potential returns
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Investment Amount: ₹50,000
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Expected Return: ₹7,500
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Value: ₹57,500
              </Typography>
            </Box>

            <Button 
              variant="contained" 
              fullWidth 
              size="large"
              onClick={handleInvestNow}
            >
              Invest Now
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Investment Dialog */}
      <Dialog 
        open={investmentDialogOpen} 
        onClose={handleCloseInvestmentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Invest in {product?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the amount you want to invest in this product.
            </Typography>
            
            <TextField
              fullWidth
              label="Investment Amount (₹)"
              type="number"
              value={investmentAmount}
              onChange={handleAmountChange}
              error={!!investmentAmountError}
              helperText={investmentAmountError || `Min: ₹${product?.min_investment.toLocaleString()}${product?.max_investment ? `, Max: ₹${product.max_investment.toLocaleString()}` : ''}`}
              sx={{ mb: 3 }}
            />

            {product && investmentAmount && !investmentAmountError && (
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Investment Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Investment Amount:</Typography>
                  <Typography variant="body2">₹{parseFloat(investmentAmount).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Annual Yield:</Typography>
                  <Typography variant="body2">{product.annual_yield}%</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tenure:</Typography>
                  <Typography variant="body2">{product.tenure_months} months</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" fontWeight="bold">Expected Return:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    ₹{((parseFloat(investmentAmount) * product.annual_yield / 100) * (product.tenure_months / 12)).toFixed(0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" fontWeight="bold">Total Value:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    ₹{(parseFloat(investmentAmount) + (parseFloat(investmentAmount) * product.annual_yield / 100) * (product.tenure_months / 12)).toFixed(0)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvestmentDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitInvestment}
            variant="contained"
            disabled={!investmentAmount || !!investmentAmountError || isCreatingInvestment}
          >
            {isCreatingInvestment ? 'Creating Investment...' : 'Confirm Investment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
