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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { apiService } from '../services/api'
import type { PortfolioSummary } from '../types'

export const PortfolioPage: React.FC = () => {
  // Fetch portfolio insights
  const { data: portfolioResponse, isLoading, error } = useQuery({
    queryKey: ['portfolio-insights'],
    queryFn: () => apiService.getPortfolioInsights('30d'),
  })

  const portfolioData = portfolioResponse?.data as PortfolioSummary | undefined

  // Transform risk distribution data for pie chart
  const pieData = portfolioData?.riskDistribution?.map((item, index) => ({
    name: item.risk_level.charAt(0).toUpperCase() + item.risk_level.slice(1),
    value: item.percentage,
    color: ['#8884d8', '#82ca9d', '#ffc658'][index] || '#ff7300'
  })) || []

  // Mock performance data for now (can be enhanced with real historical data later)
  const performanceData = [
    { month: 'Jan', returns: 2.5 },
    { month: 'Feb', returns: 3.2 },
    { month: 'Mar', returns: 2.8 },
    { month: 'Apr', returns: 4.1 },
    { month: 'May', returns: 3.7 },
    { month: 'Jun', returns: 4.5 },
  ]

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
        Failed to load portfolio data. Please try again.
      </Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Portfolio Overview
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Analyze your investment portfolio performance and distribution
      </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Returns
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="returns" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Risk Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your portfolio risk level: <strong>Low</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Based on your current investments, your portfolio is well-diversified 
              with a conservative risk profile.
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Total Invested: ₹{portfolioData?.totalInvested?.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Expected Value: ₹{portfolioData?.totalExpectedReturn?.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Expected Returns: ₹{((portfolioData?.totalExpectedReturn || 0) - (portfolioData?.totalInvested || 0)).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Weighted Avg Yield: {portfolioData?.weightedAverageYield?.toFixed(2) || 0}%
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Investment Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Active Investments: {portfolioData?.activeInvestments || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Matured Investments: {portfolioData?.maturedInvestments || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Cancelled Investments: {portfolioData?.cancelledInvestments || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Investments: {(portfolioData?.activeInvestments || 0) + (portfolioData?.maturedInvestments || 0) + (portfolioData?.cancelledInvestments || 0)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Holdings Section */}
      {portfolioData?.topHoldings && portfolioData.topHoldings.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Top Holdings
          </Typography>
          <Grid container spacing={2}>
            {portfolioData.topHoldings.slice(0, 6).map((holding, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={holding.product_id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {holding.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Amount: ₹{holding.amount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Portfolio: {holding.percentage.toFixed(1)}%
                    </Typography>
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
