import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Typography,
  Space,
  ConfigProvider,
} from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  RiseOutlined,
  WalletOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BarChartOutlined,
  SecurityScanOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'

const { Header, Sider, Content } = AntLayout
const { Title } = Typography

const menuItems = [
  { key: '/app/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/app/instruments', icon: <AppstoreOutlined />, label: 'Instruments' },
  { key: '/app/wealth', icon: <RiseOutlined />, label: 'Wealth' },
  { key: '/app/portfolio', icon: <WalletOutlined />, label: 'Portfolio' },
  { key: '/app/profile', icon: <UserOutlined />, label: 'Profile' },
]

const adminMenuItems = [
  { key: '/app/admin/products', icon: <AppstoreOutlined />, label: 'Admin Instruments' },
  { key: '/app/admin/analytics', icon: <BarChartOutlined />, label: 'Performance Analytics' },
  { key: '/app/admin/audit', icon: <SecurityScanOutlined />, label: 'Audit Trail' },
  { key: '/app/admin/logs', icon: <FileTextOutlined />, label: 'Transaction Logs' },
]

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Profile',
      onClick: () => navigate('/app/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  const allMenuItems = user?.role === 'admin' 
    ? [...menuItems, ...adminMenuItems]
    : menuItems

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          borderRadius: 8,
        },
      }}
    >
      <AntLayout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{
            background: '#fff',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ 
            padding: '16px', 
            textAlign: 'center',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Title level={4} style={{ 
              margin: 0, 
              color: '#1890ff',
              fontSize: collapsed ? '16px' : '20px'
            }}>
              {collapsed ? 'WF' : 'WealthForge'}
            </Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={allMenuItems}
            onClick={handleMenuClick}
            style={{ border: 'none' }}
          />
        </Sider>
        <AntLayout>
          <Header style={{ 
            padding: '0 24px', 
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Space>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow
              >
                <Avatar 
                  style={{ 
                    backgroundColor: '#1890ff',
                    cursor: 'pointer'
                  }}
                >
                  {user?.first_name?.charAt(0).toUpperCase()}
                </Avatar>
              </Dropdown>
            </Space>
          </Header>
          <Content style={{ 
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minHeight: 'calc(100vh - 112px)'
          }}>
            <Outlet />
          </Content>
        </AntLayout>
      </AntLayout>
    </ConfigProvider>
  )
}
