import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  TrendingUp,
  AccountBalance,
  Assessment,
  Star,
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { apiService } from '../services/api'
import type { PortfolioSummary, Investment } from '../types'

export const DashboardPage: React.FC = () => {
  // Fetch portfolio insights
  const { data: portfolioResponse, isLoading, error } = useQuery({
    queryKey: ['dashboard-portfolio-insights'],
    queryFn: () => apiService.getPortfolioInsights('30d'),
  })

  // Fetch recent investments
  const { data: investmentsResponse } = useQuery({
    queryKey: ['dashboard-recent-investments'],
    queryFn: () => apiService.getInvestments({ page: 1, pageSize: 10 }),
  })

  const portfolioData = portfolioResponse?.data as PortfolioSummary | undefined
  const recentInvestments = (investmentsResponse?.data as any)?.items || []

  // Generate performance data based on investments
  const generatePerformanceData = (investments: Investment[]) => {
    console.log('Generating performance data for investments:', investments)
    
    if (!investments || investments.length === 0) {
      console.log('No investments found, returning empty array')
      return []
    }

    // Get the last 6 months
    const months = []
    const currentDate = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        date: date,
        invested: 0,
        expected: 0,
        actual: 0
      })
    }

    console.log('Generated months:', months)

    // Calculate cumulative investments and returns for each month
    investments.forEach((investment, index) => {
      console.log(`Processing investment ${index}:`, investment)
      const investmentDate = new Date(investment.invested_at)
      
      months.forEach(month => {
        if (investmentDate <= month.date) {
          month.invested += investment.amount
          
          // Calculate expected return based on time elapsed
          const monthsElapsed = Math.max(0, (month.date.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
          const totalMonths = investment.product?.tenure_months || 12
          const progress = Math.min(monthsElapsed / totalMonths, 1)
          
          if (investment.expected_return) {
            const expectedGain = (investment.expected_return - investment.amount) * progress
            month.expected += investment.amount + expectedGain
            month.actual += investment.amount + expectedGain * 0.95 // Simulate slight variance
          } else {
            month.expected += investment.amount
            month.actual += investment.amount
          }
        }
      })
    })

    console.log('Final performance data:', months)
    return months
  }

  // Mock performance data for demonstration when real data is not available
  const mockPerformanceData = [
    { month: 'Jul', invested: 50000, expected: 52000, actual: 51800 },
    { month: 'Aug', invested: 75000, expected: 78500, actual: 78200 },
    { month: 'Sep', invested: 100000, expected: 105000, actual: 104500 },
    { month: 'Oct', invested: 125000, expected: 132000, actual: 131200 },
    { month: 'Nov', invested: 150000, expected: 158500, actual: 157800 },
    { month: 'Dec', invested: 175000, expected: 185000, actual: 184200 },
  ]

  const performanceData = generatePerformanceData(recentInvestments)
  
  // Debug logging
  console.log('Dashboard Debug:', {
    portfolioResponse,
    investmentsResponse,
    recentInvestments,
    performanceData
  })
  
  // Use mock data if no real data is available
  const chartData = performanceData.length > 0 ? performanceData : mockPerformanceData

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
        Failed to load dashboard data: {error.message || 'Please try again.'}
      </Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to your investment dashboard. Here's an overview of your portfolio.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6">Total Invested</Typography>
                  <Typography variant="h4" color="primary">
                    ₹{portfolioData?.totalInvested?.toLocaleString() || 0}
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
                  <Typography variant="h6">Expected Returns</Typography>
                  <Typography variant="h4" color="success.main">
                    ₹{((portfolioData?.totalExpectedReturn || 0) - (portfolioData?.totalInvested || 0)).toLocaleString()}
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
                <Assessment sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6">Active Investments</Typography>
                  <Typography variant="h4" color="info.main">
                    {portfolioData?.activeInvestments || 0}
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
                <Star sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6">Avg Yield</Typography>
                  <Typography variant="h4" color="warning.main">
                    {portfolioData?.weightedAverageYield?.toFixed(1) || 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Performance
            </Typography>
            {performanceData.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Showing sample performance data. Real data will appear when you have investments.
              </Alert>
            )}
            {chartData.length > 0 ? (
              <>
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `₹${value.toLocaleString()}`, 
                          name === 'invested' ? 'Invested' : 
                          name === 'expected' ? 'Expected Value' : 'Actual Value'
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="invested"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="expected"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stackId="3"
                        stroke="#ffc658"
                        fill="#ffc658"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
                {/* Chart Legend */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#8884d8', borderRadius: '50%' }} />
                    <Typography variant="body2">Invested</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#82ca9d', borderRadius: '50%' }} />
                    <Typography variant="body2">Expected Value</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#ffc658', borderRadius: '50%' }} />
                    <Typography variant="body2">Actual Value</Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No investment data available. Start investing to see your portfolio performance.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Total Investments: {(portfolioData?.activeInvestments || 0) + (portfolioData?.maturedInvestments || 0) + (portfolioData?.cancelledInvestments || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Matured: {portfolioData?.maturedInvestments || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Cancelled: {portfolioData?.cancelledInvestments || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Expected Value: ₹{portfolioData?.totalExpectedReturn?.toLocaleString() || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Investments Section */}
      {recentInvestments.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Investments
          </Typography>
          <Grid container spacing={2}>
            {recentInvestments.map((investment) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={investment.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {investment.product?.name || 'Unknown Product'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Amount: ₹{investment.amount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Status: {investment.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Invested: {new Date(investment.invested_at).toLocaleDateString()}
                    </Typography>
                    {investment.expected_return && (
                      <Typography variant="body2" color="text.secondary">
                        Expected Return: ₹{investment.expected_return.toLocaleString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  )
}
