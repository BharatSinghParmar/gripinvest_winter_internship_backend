import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Add,
  TrendingUp,
} from '@mui/icons-material'
import { apiService } from '../services/api'
import type { Investment } from '../types'

export const InvestmentsPage: React.FC = () => {
  const navigate = useNavigate()
  
  // Fetch user investments
  const { data: investmentsResponse, isLoading, error } = useQuery({
    queryKey: ['investments'],
    queryFn: () => apiService.getInvestments(),
  })

  const investments = (investmentsResponse?.data as any)?.items || []
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)
  const totalReturns = investments.reduce((sum, inv) => sum + ((inv.expected_return || inv.amount) - inv.amount), 0)
  const roi = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : 0

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load investments. Please try again.
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Investments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage your investment portfolio
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="large"
          onClick={() => navigate('/app/products')}
        >
          New Investment
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6">Total Invested</Typography>
                  <Typography variant="h4" color="primary">
                    ₹{totalInvested.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6">Total Returns</Typography>
                  <Typography variant="h4" color="success.main">
                    ₹{totalReturns.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6">Active Investments</Typography>
                  <Typography variant="h4" color="info.main">
                    {investments.filter(inv => inv.status === 'active').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6">ROI</Typography>
                  <Typography variant="h4" color="warning.main">
                    {roi}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Investment History
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Invested Date</TableCell>
                  <TableCell>Maturity Date</TableCell>
                  <TableCell>Expected Return</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No investments found. Start by exploring our investment products.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  investments.map((investment: Investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {investment.product?.name || 'Unknown Product'}
                          </Typography>
                          <Chip 
                            label={investment.product?.investment_type?.toUpperCase() || 'UNKNOWN'} 
                            size="small" 
                            color="primary" 
                          />
                        </Box>
                      </TableCell>
                      <TableCell>₹{investment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={investment.status.charAt(0).toUpperCase() + investment.status.slice(1)} 
                          size="small" 
                          color={investment.status === 'active' ? 'success' : investment.status === 'matured' ? 'info' : 'default'} 
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(investment.invested_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {investment.maturity_date ? new Date(investment.maturity_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>₹{(investment.expected_return || investment.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => navigate(`/app/products/${investment.product_id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
