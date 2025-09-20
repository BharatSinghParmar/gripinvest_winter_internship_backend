import React, { useState } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Search,
  FilterList,
  Download,
} from '@mui/icons-material'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TransactionLog } from '../../types'

export const TransactionLogsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const [filters, setFilters] = useState({
    email: '',
    endpoint: '',
    http_method: '',
    status_code: '',
    page: 1,
    pageSize: 20,
  })

  // Fetch transaction logs
  const { data: logsResponse, isLoading, error } = useQuery({
    queryKey: ['transaction-logs', filters],
    queryFn: () => {
      // Clean up filters - remove empty strings and convert status_code to number
      const cleanFilters = {
        ...filters,
        email: filters.email || undefined,
        endpoint: filters.endpoint || undefined,
        http_method: filters.http_method || undefined,
        status_code: filters.status_code ? parseInt(filters.status_code) : undefined,
      }
      return apiService.getTransactionLogs(cleanFilters)
    },
    enabled: isAuthenticated && user?.role === 'admin', // Only run query if user is authenticated and is admin
  })

  const logs = (logsResponse?.data as any)?.items || []
  const pagination = (logsResponse?.data as any)?.pagination

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }))
  }

  const handleApplyFilters = () => {
    // Trigger refetch with new filters
  }

  const handleExport = async () => {
    try {
      const response = await apiService.exportLogs('json', undefined, undefined)
      if (response.success) {
        // Create and download the file
        const dataStr = JSON.stringify(response.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `transaction-logs-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'success'
    if (statusCode >= 400 && statusCode < 500) return 'warning'
    if (statusCode >= 500) return 'error'
    return 'default'
  }

  const formatDuration = (duration: number) => {
    return `${duration}ms`
  }

  // Show message if user is not authenticated or not admin
  if (!isAuthenticated) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Transaction Logs
        </Typography>
        <Alert severity="warning">
          Please log in to access transaction logs.
        </Alert>
      </Box>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Transaction Logs
        </Typography>
        <Alert severity="error">
          Access denied. Admin privileges required to view transaction logs.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transaction Logs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor and analyze system transactions and user activities
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
                label="Email"
                variant="outlined"
                size="small"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Endpoint"
                variant="outlined"
                size="small"
                value={filters.endpoint}
                onChange={(e) => handleFilterChange('endpoint', e.target.value)}
                placeholder="/api/v1/products"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>HTTP Method</InputLabel>
                <Select 
                  label="HTTP Method"
                  value={filters.http_method}
                  onChange={(e) => handleFilterChange('http_method', e.target.value)}
                >
                  <MenuItem value="">All Methods</MenuItem>
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status Code</InputLabel>
                <Select 
                  label="Status Code"
                  value={filters.status_code}
                  onChange={(e) => handleFilterChange('status_code', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="200">200 - Success</MenuItem>
                  <MenuItem value="400">400 - Bad Request</MenuItem>
                  <MenuItem value="401">401 - Unauthorized</MenuItem>
                  <MenuItem value="500">500 - Server Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<FilterList />}
                  size="small"
                  sx={{ flex: 1 }}
                  onClick={handleApplyFilters}
                >
                  Apply
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  size="small"
                  onClick={handleExport}
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transaction Logs Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">
              Failed to load transaction logs: {error.message || 'Please try again.'}
              {(error as any).response?.data?.message && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Server error: {(error as any).response.data.message}
                </Typography>
              )}
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Endpoint</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Response Time</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                            No transaction logs found. Logs will appear here as users interact with the system.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log: TransactionLog) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {log.email || 'Anonymous'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {log.endpoint}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.http_method} 
                              size="small" 
                              color={log.http_method === 'GET' ? 'default' : 'primary'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.status_code} 
                              size="small" 
                              color={getStatusColor(log.status_code)}
                            />
                          </TableCell>
                          <TableCell>
                            {log.request_duration_ms ? formatDuration(log.request_duration_ms) : '-'}
                          </TableCell>
                          <TableCell>
                            {log.error_message ? (
                              <Typography variant="body2" color="error" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {log.error_message}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {pagination && pagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={pagination.totalPages} 
                    page={pagination.page}
                    onChange={(_, page) => handleFilterChange('page', page)}
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
