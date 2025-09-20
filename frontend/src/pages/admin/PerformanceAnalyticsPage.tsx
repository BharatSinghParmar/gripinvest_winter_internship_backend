import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Speed,
  Error,
  Assessment,
  Timeline,
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

export const PerformanceAnalyticsPage: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [period, setPeriod] = useState('30d')
  const [metric, setMetric] = useState('latency')

  // Fetch performance metrics
  const { data: metricsResponse, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['performance-metrics', period],
    queryFn: () => apiService.getPerformanceMetrics(period),
    enabled: user?.role === 'admin',
    retry: false, // Don't retry on 404 errors
  })

  // Fetch performance trends
  const { data: trendsResponse, isLoading: trendsLoading, error: trendsError } = useQuery({
    queryKey: ['performance-trends', metric, period],
    queryFn: () => apiService.getPerformanceTrends(metric, period),
    enabled: user?.role === 'admin',
    retry: false,
  })

  // Fetch slowest endpoints
  const { data: slowestResponse, isLoading: slowestLoading, error: slowestError } = useQuery({
    queryKey: ['slowest-endpoints', period],
    queryFn: () => apiService.getSlowestEndpoints(10, period),
    enabled: user?.role === 'admin',
    retry: false,
  })

  // Fetch error-prone endpoints
  const { data: errorProneResponse, isLoading: errorProneLoading, error: errorProneError } = useQuery({
    queryKey: ['error-prone-endpoints', period],
    queryFn: () => apiService.getErrorProneEndpoints(10, period),
    enabled: user?.role === 'admin',
    retry: false,
  })

  // Fetch error analysis
  const { data: errorAnalysisResponse, isLoading: errorAnalysisLoading, error: errorAnalysisError } = useQuery({
    queryKey: ['error-analysis', period],
    queryFn: () => apiService.getErrorAnalysis(period),
    enabled: user?.role === 'admin',
    retry: false,
  })


  // Mock data for demonstration when real data is not available
  const mockMetrics = {
    averageLatency: 245,
    latencyStatus: 'good',
    throughput: 1250,
    errorRate: 2.3,
    errorStatus: 'warning',
    uptime: 99.8
  }

  const mockTrends = {
    data: [
      { timestamp: '2024-01-01', value: 200 },
      { timestamp: '2024-01-02', value: 220 },
      { timestamp: '2024-01-03', value: 180 },
      { timestamp: '2024-01-04', value: 250 },
      { timestamp: '2024-01-05', value: 230 },
      { timestamp: '2024-01-06', value: 190 },
    ]
  }

  const mockSlowestEndpoints = [
    { endpoint: '/api/v1/products', method: 'GET', averageLatency: 450, status: 'warning' },
    { endpoint: '/api/v1/investments/portfolio/insights', method: 'GET', averageLatency: 380, status: 'warning' },
    { endpoint: '/api/v1/logging/transaction-logs', method: 'GET', averageLatency: 320, status: 'good' },
  ]

  const mockErrorProneEndpoints = [
    { endpoint: '/api/v1/auth/login', method: 'POST', errorRate: 15.2, severity: 'high' },
    { endpoint: '/api/v1/products', method: 'GET', errorRate: 8.5, severity: 'medium' },
    { endpoint: '/api/v1/investments', method: 'POST', errorRate: 5.1, severity: 'medium' },
  ]

  const mockErrorAnalysis = {
    errorDistribution: [
      { type: 'ValidationError', count: 45, percentage: 35 },
      { type: 'AuthenticationError', count: 30, percentage: 23 },
      { type: 'DatabaseError', count: 25, percentage: 19 },
      { type: 'Other', count: 28, percentage: 22 },
    ],
    errorTypes: [
      { type: 'ValidationError', count: 45, percentage: 35 },
      { type: 'AuthenticationError', count: 30, percentage: 23 },
      { type: 'DatabaseError', count: 25, percentage: 19 },
    ],
    recentErrors: [
      { timestamp: '2024-01-06T10:30:00Z', message: 'Invalid email format', severity: 'low' },
      { timestamp: '2024-01-06T10:25:00Z', message: 'Database connection timeout', severity: 'high' },
      { timestamp: '2024-01-06T10:20:00Z', message: 'Authentication failed', severity: 'medium' },
    ]
  }

  // Map backend response to frontend expected format
  const backendMetrics = metricsResponse?.data as any
  const metrics = backendMetrics ? {
    averageLatency: Math.round(backendMetrics.average_response_time || 0),
    latencyStatus: (backendMetrics.average_response_time || 0) < 200 ? 'excellent' : 
                   (backendMetrics.average_response_time || 0) < 500 ? 'good' : 'warning',
    throughput: Math.round(backendMetrics.total_requests || 0),
    errorRate: Math.round((backendMetrics.error_rate || 0) * 100) / 100,
    errorStatus: (backendMetrics.error_rate || 0) < 5 ? 'excellent' : 
                 (backendMetrics.error_rate || 0) < 10 ? 'warning' : 'critical',
    uptime: Math.max(0, 100 - (backendMetrics.error_rate || 0))
  } : mockMetrics
  // Map trends data from backend format to frontend format
  const backendTrends = trendsResponse?.data as any
  console.log('Trends Response:', trendsResponse)
  console.log('Backend Trends:', backendTrends)
  const trends = backendTrends && backendTrends.length > 0 ? {
    data: backendTrends.map((trend: any) => ({
      timestamp: trend.period,
      value: Math.round(trend.average_response_time || 0)
    }))
  } : mockTrends
  
  console.log('Final Trends Data:', trends)
  
  // Map slowest endpoints from backend format to frontend format
  const backendSlowestEndpoints = slowestResponse?.data as any
  const slowestEndpoints = backendSlowestEndpoints ? backendSlowestEndpoints.map((endpoint: any) => ({
    endpoint: endpoint.endpoint,
    method: 'GET', // Default method since backend doesn't provide it
    averageLatency: Math.round(endpoint.average_duration || 0),
    status: (endpoint.average_duration || 0) < 200 ? 'excellent' : 
            (endpoint.average_duration || 0) < 500 ? 'good' : 'warning'
  })) : mockSlowestEndpoints
  
  // Map error-prone endpoints from backend format to frontend format
  const backendErrorProneEndpoints = errorProneResponse?.data as any
  const errorProneEndpoints = backendErrorProneEndpoints ? backendErrorProneEndpoints.map((endpoint: any) => ({
    endpoint: endpoint.endpoint,
    method: 'GET', // Default method since backend doesn't provide it
    errorRate: Math.round((endpoint.error_rate || 0) * 100) / 100,
    severity: (endpoint.error_rate || 0) > 10 ? 'high' : 
              (endpoint.error_rate || 0) > 5 ? 'medium' : 'low'
  })) : mockErrorProneEndpoints
  // Map error analysis data from backend format to frontend format
  const backendErrorAnalysis = errorAnalysisResponse?.data as any
  console.log('Error Analysis Response:', errorAnalysisResponse)
  console.log('Backend Error Analysis:', backendErrorAnalysis)
  const errorAnalysis = backendErrorAnalysis && (backendErrorAnalysis.topErrors?.length > 0 || backendErrorAnalysis.patterns?.length > 0) ? {
    errorDistribution: backendErrorAnalysis.topErrors?.map((error: any) => ({
      type: error.errorCode || 'Unknown',
      count: error.count || 0,
      percentage: error.percentage || 0
    })) || [],
    errorTypes: backendErrorAnalysis.topErrors?.map((error: any) => ({
      type: error.errorCode || 'Unknown',
      count: error.count || 0,
      percentage: error.percentage || 0
    })) || [],
    recentErrors: backendErrorAnalysis.patterns?.slice(0, 3).map((pattern: any) => ({
      timestamp: pattern.lastOccurrence || new Date().toISOString(),
      message: pattern.errorCode || 'Unknown error',
      severity: pattern.severity || 'low'
    })) || []
  } : mockErrorAnalysis
  
  console.log('Final Error Analysis Data:', errorAnalysis)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'success'
      case 'good': return 'info'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  if (user?.role !== 'admin') {
    return (
      <Box>
        <Alert severity="error">
          Access denied. Admin privileges required to view performance analytics.
        </Alert>
      </Box>
    )
  }

  const isLoading = metricsLoading || trendsLoading || slowestLoading || errorProneLoading || errorAnalysisLoading
  const hasErrors = metricsError || trendsError || slowestError || errorProneError || errorAnalysisError

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {hasErrors && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Some performance data is not available. The backend may not have all analytics endpoints implemented yet.
        </Alert>
      )}
      
      {(!metricsResponse?.data || !trendsResponse?.data) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Showing sample data for demonstration. Real performance data will appear when the backend analytics are fully implemented.
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Performance Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor system performance and identify bottlenecks
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
            <MenuItem value="1y">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Assessment />} label="Overview" />
          <Tab icon={<Timeline />} label="Trends" />
          <Tab icon={<Speed />} label="Endpoints" />
          <Tab icon={<Error />} label="Errors" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Average Response Time</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {metrics?.averageLatency || 0}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics?.latencyStatus || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Speed sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Throughput</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {metrics?.throughput || 0}/min
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Requests per minute
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Error sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="h6">Error Rate</Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {metrics?.errorRate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics?.errorStatus || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assessment sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">Uptime</Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  {metrics?.uptime || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System availability
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Chart */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Error Distribution */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={errorAnalysis?.errorDistribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {errorAnalysis?.errorDistribution?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FormControl sx={{ minWidth: 120, mr: 2 }}>
                    <InputLabel>Metric</InputLabel>
                    <Select
                      value={metric}
                      label="Metric"
                      onChange={(e) => setMetric(e.target.value)}
                    >
                      <MenuItem value="latency">Latency</MenuItem>
                      <MenuItem value="throughput">Throughput</MenuItem>
                      <MenuItem value="error_rate">Error Rate</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Slowest Endpoints
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Avg Latency</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {slowestEndpoints.map((endpoint: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{endpoint.endpoint}</TableCell>
                          <TableCell>
                            <Chip label={endpoint.method} size="small" />
                          </TableCell>
                          <TableCell>{endpoint.averageLatency}ms</TableCell>
                          <TableCell>
                            <Chip
                              label={endpoint.status}
                              color={getStatusColor(endpoint.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error-Prone Endpoints
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Error Rate</TableCell>
                        <TableCell>Severity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {errorProneEndpoints.map((endpoint: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{endpoint.endpoint}</TableCell>
                          <TableCell>
                            <Chip label={endpoint.method} size="small" />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={endpoint.errorRate || 0}
                                  color={endpoint.errorRate > 10 ? 'error' : endpoint.errorRate > 5 ? 'warning' : 'success'}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {endpoint.errorRate || 0}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={endpoint.severity}
                              color={getSeverityColor(endpoint.severity)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Error Types
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Error Type</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {errorAnalysis?.errorTypes?.map((errorType: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{errorType.type}</TableCell>
                              <TableCell>{errorType.count}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={errorType.percentage || 0}
                                      color="error"
                                    />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {errorType.percentage || 0}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Recent Errors
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Error</TableCell>
                            <TableCell>Severity</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {errorAnalysis?.recentErrors?.map((error: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                {new Date(error.timestamp).toLocaleString()}
                              </TableCell>
                              <TableCell>{error.message}</TableCell>
                              <TableCell>
                                <Chip
                                  label={error.severity}
                                  color={getSeverityColor(error.severity)}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
