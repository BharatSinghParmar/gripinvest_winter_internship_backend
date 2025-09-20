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
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Search,
  FilterList,
  Download,
  Visibility,
  Assessment,
  Timeline,
  Person,
  Security,
} from '@mui/icons-material'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

export const AuditTrailPage: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resourceType: '',
    resourceId: '',
    from: '',
    to: '',
    page: 1,
    pageSize: 20,
  })
  const [selectedAudit, setSelectedAudit] = useState<any>(null)
  const [openDetails, setOpenDetails] = useState(false)

  // Fetch audit trail
  const { data: auditResponse, isLoading, error } = useQuery({
    queryKey: ['audit-trail', filters],
    queryFn: () => {
      const cleanFilters = {
        ...filters,
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        resourceId: filters.resourceId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }
      return apiService.getAuditTrail(cleanFilters)
    },
    enabled: user?.role === 'admin',
  })

  // Fetch audit statistics
  const { data: statsResponse, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['audit-statistics', filters],
    queryFn: () => apiService.getAuditStatistics('30d', 'action'),
    enabled: user?.role === 'admin',
  })

  const auditLogs = (auditResponse?.data as any)?.items || []
  const pagination = (auditResponse?.data as any)?.pagination
  const statistics = statsResponse?.data as any

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }))
  }

  const handleApplyFilters = () => {
    // Trigger refetch with new filters
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export audit trail')
  }

  const handleViewDetails = (audit: any) => {
    setSelectedAudit(audit)
    setOpenDetails(true)
  }

  const handleCloseDetails = () => {
    setOpenDetails(false)
    setSelectedAudit(null)
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'success'
      case 'update': return 'info'
      case 'delete': return 'error'
      case 'login': return 'primary'
      case 'logout': return 'secondary'
      default: return 'default'
    }
  }

  const getResourceColor = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'user': return 'primary'
      case 'product': return 'secondary'
      case 'investment': return 'success'
      case 'auth': return 'warning'
      default: return 'default'
    }
  }

  if (user?.role !== 'admin') {
    return (
      <Box>
        <Alert severity="error">
          Access denied. Admin privileges required to view audit trail.
        </Alert>
      </Box>
    )
  }

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
        Failed to load audit trail: {error.message || 'Please try again.'}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Audit Trail
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track system activities and user actions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExport}
        >
          Export
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Timeline />} label="Audit Logs" />
          <Tab icon={<Assessment />} label="Statistics" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="User ID"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Action</InputLabel>
                    <Select
                      value={filters.action}
                      label="Action"
                      onChange={(e) => handleFilterChange('action', e.target.value)}
                    >
                      <MenuItem value="">All Actions</MenuItem>
                      <MenuItem value="create">Create</MenuItem>
                      <MenuItem value="update">Update</MenuItem>
                      <MenuItem value="delete">Delete</MenuItem>
                      <MenuItem value="login">Login</MenuItem>
                      <MenuItem value="logout">Logout</MenuItem>
                      <MenuItem value="view">View</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Resource Type</InputLabel>
                    <Select
                      value={filters.resourceType}
                      label="Resource Type"
                      onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="product">Product</MenuItem>
                      <MenuItem value="investment">Investment</MenuItem>
                      <MenuItem value="auth">Authentication</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Resource ID"
                    value={filters.resourceId}
                    onChange={(e) => handleFilterChange('resourceId', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="From Date"
                    type="datetime-local"
                    value={filters.from}
                    onChange={(e) => handleFilterChange('from', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="To Date"
                    type="datetime-local"
                    value={filters.to}
                    onChange={(e) => handleFilterChange('to', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Page Size</InputLabel>
                    <Select
                      value={filters.pageSize}
                      label="Page Size"
                      onChange={(e) => handleFilterChange('pageSize', e.target.value)}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<FilterList />}
                    onClick={handleApplyFilters}
                    sx={{ height: '40px' }}
                  >
                    Apply Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Resource</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.map((log: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1, fontSize: 16 }} />
                            {log.userId || 'System'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            color={getActionColor(log.action)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Chip
                              label={log.resourceType}
                              color={getResourceColor(log.resourceType)}
                              size="small"
                              sx={{ mb: 0.5 }}
                            />
                            <Typography variant="caption" display="block">
                              {log.resourceId}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.details ? JSON.stringify(log.details).substring(0, 50) + '...' : 'No details'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(log)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {pagination && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={pagination.totalPages}
                    page={filters.page}
                    onChange={(_, page) => handleFilterChange('page', page)}
                    color="primary"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Action Statistics */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Action Statistics
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>Count</TableCell>
                        <TableCell>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistics?.actionStats?.map((stat: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={stat.action}
                              color={getActionColor(stat.action)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{stat.count}</TableCell>
                          <TableCell>{stat.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Resource Statistics */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resource Statistics
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Resource Type</TableCell>
                        <TableCell>Count</TableCell>
                        <TableCell>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistics?.resourceStats?.map((stat: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={stat.resourceType}
                              color={getResourceColor(stat.resourceType)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{stat.count}</TableCell>
                          <TableCell>{stat.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* User Activity */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Activity
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Actions Count</TableCell>
                        <TableCell>Last Activity</TableCell>
                        <TableCell>Most Common Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistics?.userStats?.map((stat: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Person sx={{ mr: 1, fontSize: 16 }} />
                              {stat.userId || 'System'}
                            </Box>
                          </TableCell>
                          <TableCell>{stat.actionCount}</TableCell>
                          <TableCell>
                            {new Date(stat.lastActivity).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={stat.mostCommonAction}
                              color={getActionColor(stat.mostCommonAction)}
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

      {/* Audit Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Security sx={{ mr: 1 }} />
            Audit Log Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAudit && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedAudit.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedAudit.userId || 'System'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Action
                  </Typography>
                  <Chip
                    label={selectedAudit.action}
                    color={getActionColor(selectedAudit.action)}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resource Type
                  </Typography>
                  <Chip
                    label={selectedAudit.resourceType}
                    color={getResourceColor(selectedAudit.resourceType)}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resource ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedAudit.resourceId}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Details
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(selectedAudit.details, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
