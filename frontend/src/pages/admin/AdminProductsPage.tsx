import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Fab,
  Tooltip,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  AutoFixHigh,
  Save,
  Cancel,
} from '@mui/icons-material'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { Product } from '../../types'

// Validation schemas
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  investment_type: z.enum(['fd', 'bond', 'mf', 'etf', 'other']),
  tenure_months: z.number().min(1, 'Tenure must be at least 1 month'),
  annual_yield: z.number().min(0, 'Annual yield must be positive'),
  risk_level: z.enum(['low', 'moderate', 'high']),
  min_investment: z.number().min(1, 'Minimum investment must be positive'),
  max_investment: z.number().optional(),
})

type ProductForm = z.infer<typeof productSchema>

export const AdminProductsPage: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Fetch products
  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => apiService.getProducts({ page: 1, pageSize: 100 }),
    enabled: user?.role === 'admin',
  })

  const products = (productsResponse?.data as any)?.items || []

  // Create/Update product mutation
  const productMutation = useMutation({
    mutationFn: (data: ProductForm) => {
      if (editingProduct) {
        return apiService.updateProduct(editingProduct.id, data)
      } else {
        return apiService.createProduct(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setOpenDialog(false)
      setEditingProduct(null)
      setSnackbar({ open: true, message: `Product ${editingProduct ? 'updated' : 'created'} successfully!`, severity: 'success' })
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Operation failed', severity: 'error' })
    },
  })

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (productId: string) => apiService.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setSnackbar({ open: true, message: 'Product deleted successfully!', severity: 'success' })
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Delete failed', severity: 'error' })
    },
  })

  // Generate AI description mutation
  const aiDescriptionMutation = useMutation({
    mutationFn: (productId: string) => apiService.generateProductDescription(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setSnackbar({ open: true, message: 'AI description generated successfully!', severity: 'success' })
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.message || 'AI generation failed', severity: 'error' })
    },
  })

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      investment_type: 'fd',
      tenure_months: 12,
      annual_yield: 0,
      risk_level: 'moderate',
      min_investment: 1000,
      max_investment: undefined,
    },
  })

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      form.reset({
        name: product.name,
        description: product.description || '',
        investment_type: product.investment_type,
        tenure_months: product.tenure_months,
        annual_yield: product.annual_yield,
        risk_level: product.risk_level,
        min_investment: product.min_investment,
        max_investment: product.max_investment || undefined,
      })
    } else {
      setEditingProduct(null)
      form.reset()
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingProduct(null)
    form.reset()
  }

  const handleSubmit = (data: ProductForm) => {
    productMutation.mutate(data)
  }

  const handleDelete = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(productId)
    }
  }

  const handleGenerateDescription = (productId: string) => {
    aiDescriptionMutation.mutate(productId)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success'
      case 'moderate': return 'warning'
      case 'high': return 'error'
      default: return 'default'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fd': return 'primary'
      case 'bond': return 'secondary'
      case 'mf': return 'info'
      case 'etf': return 'warning'
      default: return 'default'
    }
  }

  if (user?.role !== 'admin') {
    return (
      <Box>
        <Alert severity="error">
          Access denied. Admin privileges required to manage products.
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
        Failed to load products: {error.message || 'Please try again.'}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Product Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage investment products and their details
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Tenure</TableCell>
                  <TableCell>Yield</TableCell>
                  <TableCell>Min Investment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {product.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.investment_type.toUpperCase()}
                        color={getTypeColor(product.investment_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.risk_level.charAt(0).toUpperCase() + product.risk_level.slice(1)}
                        color={getRiskColor(product.risk_level)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{product.tenure_months} months</TableCell>
                    <TableCell>{product.annual_yield}%</TableCell>
                    <TableCell>₹{product.min_investment.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.is_active ? 'Active' : 'Inactive'}
                        color={product.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Generate AI Description">
                          <IconButton
                            size="small"
                            onClick={() => handleGenerateDescription(product.id)}
                            disabled={aiDescriptionMutation.isPending}
                          >
                            <AutoFixHigh />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(product.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Product Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="investment_type"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Investment Type</InputLabel>
                      <Select {...field} label="Investment Type">
                        <MenuItem value="fd">Fixed Deposit</MenuItem>
                        <MenuItem value="bond">Bond</MenuItem>
                        <MenuItem value="mf">Mutual Fund</MenuItem>
                        <MenuItem value="etf">ETF</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="tenure_months"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Tenure (months)"
                      type="number"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="annual_yield"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Annual Yield (%)"
                      type="number"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="risk_level"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Risk Level</InputLabel>
                      <Select {...field} label="Risk Level">
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="moderate">Moderate</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="min_investment"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Minimum Investment (₹)"
                      type="number"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="max_investment"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Maximum Investment (₹)"
                      type="number"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            variant="contained"
            startIcon={<Save />}
            disabled={productMutation.isPending}
          >
            {productMutation.isPending ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
