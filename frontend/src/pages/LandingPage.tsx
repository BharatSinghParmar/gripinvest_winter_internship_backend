import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layout,
  Button,
  Typography,
  Row,
  Col,
  Card,
  Space,
  ConfigProvider,
} from 'antd'
import {
  ThunderboltOutlined,
  SafetyOutlined,
  RocketOutlined,
  BarChartOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'

const { Header, Content } = Layout
const { Title, Paragraph } = Typography

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: <ThunderboltOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: 'Smart Wealth Building',
      description: 'ML-powered recommendations based on your risk tolerance and financial objectives.',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: 'Enterprise Security',
      description: 'Military-grade security with JWT authentication and encrypted data transmission.',
    },
    {
      icon: <RocketOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: 'Lightning Fast',
      description: 'Ultra-fast performance with real-time wealth tracking and instant updates.',
    },
    {
      icon: <BarChartOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: 'Advanced Analytics',
      description: 'Comprehensive insights and detailed reporting for your wealth portfolio.',
    },
  ]

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
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            WealthForge
          </Title>
          <Space>
            <Button type="text" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button type="primary" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </Space>
        </Header>

        <Content>
          {/* Hero Section */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
              color: 'white',
              textAlign: 'center',
              padding: '80px 24px',
              margin: '24px',
              borderRadius: '12px',
            }}
          >
            <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
              Forge Your Wealth, Shape Your Future
            </Title>
            <Paragraph style={{ 
              color: 'white', 
              fontSize: '20px', 
              marginBottom: '32px',
              opacity: 0.9 
            }}>
              Your gateway to intelligent wealth management with machine learning-powered insights
            </Paragraph>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                style={{ 
                  background: 'white', 
                  color: '#1890ff',
                  border: 'none',
                  height: '48px',
                  padding: '0 32px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
                onClick={() => navigate('/signup')}
              >
                Start Building Wealth
              </Button>
              <Button
                size="large"
                style={{ 
                  borderColor: 'white', 
                  color: 'white',
                  height: '48px',
                  padding: '0 32px',
                  fontSize: '16px'
                }}
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </Space>
          </div>

          {/* Features Section */}
          <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: '48px' }}>
              Why Choose WealthForge?
            </Title>
            <Row gutter={[24, 24]}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      textAlign: 'center',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    bodyStyle={{ padding: '32px 24px' }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      {feature.icon}
                    </div>
                    <Title level={4} style={{ marginBottom: '12px' }}>
                      {feature.title}
                    </Title>
                    <Paragraph style={{ color: '#666', margin: 0 }}>
                      {feature.description}
                    </Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* CTA Section */}
          <div
            style={{
              background: '#f8f9fa',
              textAlign: 'center',
              padding: '64px 24px',
              margin: '24px',
              borderRadius: '12px',
            }}
          >
            <Title level={2} style={{ marginBottom: '16px' }}>
              Ready to Begin Your Wealth Journey?
            </Title>
            <Paragraph style={{ 
              fontSize: '18px', 
              color: '#666', 
              marginBottom: '32px' 
            }}>
              Join thousands of wealth builders who trust WealthForge for their financial growth
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              style={{
                height: '48px',
                padding: '0 32px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              onClick={() => navigate('/signup')}
            >
              Create Your Account
            </Button>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  )
}
