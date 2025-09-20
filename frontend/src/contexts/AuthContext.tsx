import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react'
import type { User, AuthResponse } from '../types'
import { apiService } from '../services/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  signup: (userData: any) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
  clearError: () => void
  checkAuth: () => Promise<void>
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // No token is normal for unauthenticated users, don't set error
      dispatch({ type: 'AUTH_LOGOUT' })
      return
    }

    try {
      dispatch({ type: 'AUTH_START' })
      const response = await apiService.getCurrentUser()
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data as User })
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Invalid token' })
        localStorage.removeItem('accessToken')
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Authentication failed' })
      localStorage.removeItem('accessToken')
    }
  }

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await apiService.login(email, password)
      
      if (response.success && response.data) {
        const { accessToken, user } = response.data as AuthResponse
        localStorage.setItem('accessToken', accessToken)
        dispatch({ type: 'AUTH_SUCCESS', payload: user })
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message || 'Login failed' })
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.response?.data?.message || 'Login failed' })
    }
  }

  const signup = async (userData: any) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await apiService.signup(userData)
      
      if (response.success && response.data) {
        const { accessToken, user } = response.data as AuthResponse
        localStorage.setItem('accessToken', accessToken)
        dispatch({ type: 'AUTH_SUCCESS', payload: user })
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message || 'Signup failed' })
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.response?.data?.message || 'Signup failed' })
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken')
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }

  const updateUser = (user: User) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: user })
  }

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    updateUser,
    clearError,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
