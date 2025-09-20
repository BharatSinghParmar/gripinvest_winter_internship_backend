import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Search,
  FilterList,
} from '@mui/icons-material'
import { apiService } from '../services/api'
import type { Product } from '../types'

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    search: '',
    investmentType: 'all',
    riskLevel: 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
  }

  // Fetch products with applied filters
  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: ['products', appliedFilters],
    queryFn: () => {
      const queryParams: any = {}
      
      if (appliedFilters.search) {
        queryParams.search = appliedFilters.search
      }
      if (appliedFilters.investmentType !== 'all') {
        queryParams.investment_type = appliedFilters.investmentType
      }
      if (appliedFilters.riskLevel !== 'all') {
        queryParams.risk_level = appliedFilters.riskLevel
      }
      
      return apiService.getProducts(queryParams)
    },
  })

  // Ensure products is always an array - API returns { items: [...], pagination: {...} }
  const products = Array.isArray((productsResponse?.data as any)?.items) ? (productsResponse.data as any).items : []

  const handleViewDetails = (productId: string) => {
    navigate(`/app/products/${productId}`)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      investmentType: 'all',
      riskLevel: 'all',
    }
    setFilters(clearedFilters)
    setAppliedFilters(clearedFilters)
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Investment Products
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Explore our range of investment products tailored to your risk appetite.
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Search products"
                variant="outlined"
                size="small"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Investment Type</InputLabel>
                <Select 
                  label="Investment Type"
                  value={filters.investmentType}
                  onChange={(e) => handleFilterChange('investmentType', e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="bond">Bonds</MenuItem>
                  <MenuItem value="fd">Fixed Deposits</MenuItem>
                  <MenuItem value="mf">Mutual Funds</MenuItem>
                  <MenuItem value="etf">ETFs</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Risk Level</InputLabel>
                <Select 
                  label="Risk Level"
                  value={filters.riskLevel}
                  onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="low">Low Risk</MenuItem>
                  <MenuItem value="moderate">Moderate Risk</MenuItem>
                  <MenuItem value="high">High Risk</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="contained"
                startIcon={<FilterList />}
                fullWidth
                size="small"
                onClick={handleApplyFilters}
                sx={{ mb: 1 }}
              >
                Apply Filters
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load products. Please try again.
          {error && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Error: {error.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
        </Alert>
      ) : products.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No products found matching your criteria.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {products.map((product: Product) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {product.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={product.investment_type.toUpperCase()} 
                      size="small" 
                      color="primary" 
                    />
                    <Chip 
                      label={`${product.risk_level.charAt(0).toUpperCase() + product.risk_level.slice(1)} Risk`} 
                      size="small" 
                      color={product.risk_level === 'low' ? 'success' : product.risk_level === 'moderate' ? 'warning' : 'error'} 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Annual Yield: {product.annual_yield}% | Tenure: {product.tenure_months} months
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Min Investment: ₹{product.min_investment.toLocaleString()}
                    {product.max_investment && ` | Max: ₹${product.max_investment.toLocaleString()}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.description}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleViewDetails(product.id)}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
