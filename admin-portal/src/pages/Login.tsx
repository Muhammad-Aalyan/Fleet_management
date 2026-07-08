import { useState } from 'react'
import { Form, Input, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const RESEND_COOLDOWN = 30

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [otpForm] = Form.useForm()

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [pending, setPending] = useState<{ userId: number; email: string } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN)
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const onFinishCredentials = async (values: { email: string; password: string }) => {
    try {
      const res = await api.post('/auth/login', values)
      if (res.data.otpRequired) {
        setPending({ userId: res.data.userId, email: res.data.email })
        setStep('otp')
        startCooldown()
        message.success('A verification code has been sent to your email.')
      }
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Invalid email or password')
    }
  }

  const onFinishOtp = async (values: { otp: string }) => {
    if (!pending) return
    setVerifying(true)
    try {
      const res = await api.post('/auth/verify-otp', { userId: pending.userId, otp: values.otp })
      const { token, user } = res.data
      if (user.role !== 'ADMIN') {
        message.error('Access denied. Admin credentials required.')
        return
      }
      login(token, user)
      navigate('/dashboard')
      message.success(`Welcome back, ${user.name}!`)
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Invalid verification code')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!pending || cooldown > 0) return
    try {
      await api.post('/auth/resend-otp', { userId: pending.userId })
      message.success('A new code has been sent to your email.')
      startCooldown()
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Please wait before requesting another code')
    }
  }

  return (
    <div className="rd-login-page">
      <div className="rd-glow-ring" />
      <div className="rd-glow-ring r2" />
      <div className="rd-login-road" />

      <div className="rd-login-card">
        <div className="rd-login-logo"><img src="/logo-login.png" alt="Ride On" /></div>

        {step === 'credentials' ? (
          <>
            <h1>Admin Portal</h1>
            <p className="sub">Sign in to manage your fleet</p>

            <Form form={form} layout="vertical" onFinish={onFinishCredentials}>
              <Form.Item name="email" className="rd-login-field" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
                <Input prefix={<UserOutlined />} placeholder="Admin email" />
              </Form.Item>
              <Form.Item name="password" className="rd-login-field" rules={[{ required: true, message: 'Enter your password' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>

              <div className="rd-row-opts">
                <label><input type="checkbox" style={{ accentColor: '#E01E2B' }} /> Remember me</label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <Form.Item style={{ marginBottom: 0 }}>
                <button type="submit" className="rd-btn-signin">Sign In</button>
              </Form.Item>
            </Form>
          </>
        ) : (
          <>
            <h1>Verify Your Email</h1>
            <p className="rd-otp-hint">Enter the 6-digit code sent to <strong>{pending?.email}</strong></p>

            <Form form={otpForm} layout="vertical" onFinish={onFinishOtp}>
              <Form.Item name="otp" className="rd-login-field rd-otp-field" rules={[{ required: true, len: 6, message: 'Enter the 6-digit code' }]}>
                <Input prefix={<SafetyOutlined />} placeholder="000000" maxLength={6} autoFocus />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <button type="submit" className="rd-btn-signin" disabled={verifying}>
                  {verifying ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </Form.Item>
            </Form>

            <div className="rd-otp-resend">
              Didn't get the code?{' '}
              <button type="button" onClick={handleResend} disabled={cooldown > 0}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
            <div className="rd-otp-back">
              <button type="button" onClick={() => { setStep('credentials'); setPending(null); otpForm.resetFields() }}>
                ← Use a different account
              </button>
            </div>
          </>
        )}

        <div className="rd-login-foot">BRING IT <span>ON!</span></div>
      </div>
    </div>
  )
}
