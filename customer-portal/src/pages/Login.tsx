import { Form, Input, Button, Card, Typography, message, Divider } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const { Title, Text } = Typography

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const res = await api.post('/auth/login', values)
      const { token, user } = res.data
      if (user.role !== 'CUSTOMER') {
        message.error('Access denied. Customer credentials required.')
        return
      }
      login(token, user)
      navigate('/home')
      message.success(`Welcome back, ${user.name}!`)
    } catch {
      message.error('Invalid email or password')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Card style={{ width: 420, borderRadius: 16, boxShadow: '0 20px 60px rgba(124,58,237,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 28,
          }}>🚖</div>
          <Title level={3} style={{ margin: 0 }}>Welcome Back</Title>
          <Text type="secondary">Sign in to book your ride</Text>
        </div>
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email address" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Enter your password' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" block
              style={{ height: 44, background: '#7c3aed', borderColor: '#7c3aed' }}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
        <Divider plain><Text type="secondary" style={{ fontSize: 12 }}>Don't have an account?</Text></Divider>
        <Link to="/register">
          <Button block style={{ borderColor: '#7c3aed', color: '#7c3aed' }}>Create Account</Button>
        </Link>
      </Card>
    </div>
  )
}
