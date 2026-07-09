import { useState } from 'react'
import { Form, Input, message } from 'antd'
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

const RESEND_COOLDOWN = 30

type Step = 'email' | 'otp' | 'password'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [emailForm] = Form.useForm()
  const [otpForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const [step, setStep] = useState<Step>('email')
  const [pending, setPending] = useState<{ userId: number; email: string } | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
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

  const onFinishEmail = async (values: { email: string }) => {
    setSubmitting(true)
    try {
      const res = await api.post('/auth/forgot-password', values)
      setPending({ userId: res.data.userId, email: res.data.email })
      setStep('otp')
      startCooldown()
      message.success('A verification code has been sent to your email.')
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to send verification code')
    } finally {
      setSubmitting(false)
    }
  }

  const onFinishOtp = async (values: { otp: string }) => {
    if (!pending) return
    setSubmitting(true)
    try {
      const res = await api.post('/auth/forgot-password/verify-otp', { userId: pending.userId, otp: values.otp })
      setResetToken(res.data.resetToken)
      setStep('password')
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Invalid verification code')
    } finally {
      setSubmitting(false)
    }
  }

  const onFinishPassword = async (values: { password: string; confirm: string }) => {
    if (!pending || !resetToken) return
    if (values.password !== values.confirm) {
      message.error('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', { userId: pending.userId, resetToken, newPassword: values.password })
      message.success('Password updated! Please sign in with your new password.')
      navigate('/login')
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!pending || cooldown > 0) return
    try {
      await api.post('/auth/forgot-password/resend-otp', { userId: pending.userId })
      message.success('A new code has been sent to your email.')
      startCooldown()
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Please wait before requesting another code')
    }
  }

  return (
    <div className="rd-login-page">
      <div className="rd-login-bg-logo" />

      <div className="rd-login-card">
        <div className="rd-login-logo"><img src="/logo-login.png" alt="Ride On" /></div>

        {step === 'email' && (
          <>
            <h1>Forgot Password</h1>
            <p className="sub">Enter your email and we'll send you a verification code</p>

            <Form form={emailForm} layout="vertical" onFinish={onFinishEmail}>
              <Form.Item name="email" className="rd-login-field" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
                <Input prefix={<MailOutlined />} placeholder="Your account email" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <button type="submit" className="rd-btn-signin" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send Code'}
                </button>
              </Form.Item>
            </Form>

            <div className="rd-otp-back">
              <Link to="/login"><button type="button">← Back to Sign In</button></Link>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1>Verify Your Email</h1>
            <p className="rd-otp-hint">Enter the 6-digit code sent to <strong>{pending?.email}</strong></p>

            <Form form={otpForm} layout="vertical" onFinish={onFinishOtp}>
              <Form.Item name="otp" className="rd-login-field rd-otp-field" rules={[{ required: true, len: 6, message: 'Enter the 6-digit code' }]}>
                <Input prefix={<SafetyOutlined />} placeholder="000000" maxLength={6} autoFocus />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <button type="submit" className="rd-btn-signin" disabled={submitting}>
                  {submitting ? 'Verifying…' : 'Verify Code'}
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
              <button type="button" onClick={() => { setStep('email'); setPending(null); otpForm.resetFields() }}>
                ← Use a different email
              </button>
            </div>
          </>
        )}

        {step === 'password' && (
          <>
            <h1>Set New Password</h1>
            <p className="sub">Choose a new password for your account</p>

            <Form form={passwordForm} layout="vertical" onFinish={onFinishPassword}>
              <Form.Item name="password" className="rd-login-field" rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="New password" />
              </Form.Item>
              <Form.Item
                name="confirm"
                className="rd-login-field"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve()
                      return Promise.reject(new Error('Passwords do not match'))
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Retype new password" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <button type="submit" className="rd-btn-signin" disabled={submitting}>
                  {submitting ? 'Updating…' : 'Update Password'}
                </button>
              </Form.Item>
            </Form>
          </>
        )}

        <div className="rd-login-foot">BRING IT <span>ON!</span></div>
      </div>
    </div>
  )
}
