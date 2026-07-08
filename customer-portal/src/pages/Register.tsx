import { Form, Input, message } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values: any) => {
    try {
      const res = await api.post('/auth/register', { ...values, role: 'CUSTOMER' })
      const { token, user } = res.data
      login(token, user)
      message.success('Account created! Welcome aboard.')
      navigate('/home')
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="rd-login-page">
      <div className="rd-glow-ring" />
      <div className="rd-glow-ring r2" />
      <div className="rd-login-road" />

      <div className="rd-login-card" style={{ width: 460 }}>
        <div className="rd-login-logo"><img src="/logo-login.png" alt="Ride On" /></div>
        <h1>Create Account</h1>
        <p className="sub">Start booking rides today</p>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" className="rd-login-field" rules={[{ required: true, message: 'Enter your full name' }]}>
            <Input prefix={<UserOutlined />} placeholder="Full name" />
          </Form.Item>
          <Form.Item name="email" className="rd-login-field" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email address" />
          </Form.Item>
          <Form.Item name="phone" className="rd-login-field" rules={[{ required: true, message: 'Enter your phone number' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="Phone number" />
          </Form.Item>
          <Form.Item name="password" className="rd-login-field" rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            className="rd-login-field"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <button type="submit" className="rd-btn-signin">Create Account</button>
          </Form.Item>
        </Form>

        <div className="rd-signin-line">Already have an account? <Link to="/login">Sign in</Link></div>
        <div className="rd-login-foot">BRING IT <span>ON!</span></div>
      </div>
    </div>
  )
}
