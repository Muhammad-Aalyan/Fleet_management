import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
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
      const { access_token, user } = res.data
      if (user.role !== 'DRIVER') {
        message.error('Access denied. Driver credentials required.')
        return
      }
      login(access_token, user)
      message.success('Welcome back, Driver!')
      navigate('/dashboard')
    } catch {
      message.error('Invalid email or password')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Card style={{
        width: 420, borderRadius: 12,
        background: '#1f2937', border: '1px solid #374151',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 28,
          }}>🚘</div>
          <Title level={3} style={{ margin: 0, color: '#f9fafb' }}>Driver Portal</Title>
          <Text style={{ color: '#9ca3af' }}>Sign in to your driver account</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
            <Input prefix={<UserOutlined />} placeholder="Driver email"
              style={{ background: '#374151', borderColor: '#4b5563', color: '#f9fafb' }} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Enter your password' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password"
              style={{ background: '#374151', borderColor: '#4b5563', color: '#f9fafb' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block style={{ height: 44, background: '#f97316', borderColor: '#f97316' }}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
