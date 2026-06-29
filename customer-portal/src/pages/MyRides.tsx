import { Card, Tag, Button, Typography, Steps, Empty } from 'antd'
import { EnvironmentOutlined, UserOutlined, CarOutlined, CloseCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const rides = [
  { id: 1, pickup: 'DHA Phase 5', drop: 'Saddar', date: '2026-06-29', time: '10:30 AM', driver: 'Ahmed Khan', vehicle: 'KHI-001', status: 'IN_PROGRESS', step: 3 },
  { id: 2, pickup: 'Gulshan-e-Iqbal', drop: 'Clifton', date: '2026-06-30', time: '02:00 PM', driver: null, vehicle: null, status: 'PENDING', step: 0 },
]

const statusColors: Record<string, string> = {
  PENDING: 'gold', APPROVED: 'blue', ASSIGNED: 'purple', IN_PROGRESS: 'processing', COMPLETED: 'green', CANCELLED: 'red',
}

const statusStep: Record<string, number> = {
  PENDING: 0, APPROVED: 1, ASSIGNED: 2, IN_PROGRESS: 3, COMPLETED: 4,
}

export default function MyRides() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>My Rides</Title>

      {rides.length === 0 ? (
        <Empty description="No active rides" />
      ) : (
        rides.map(ride => (
          <Card key={ride.id} style={{ marginBottom: 16, border: '1px solid #ede9fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <Tag color={statusColors[ride.status]} style={{ marginBottom: 8 }}>{ride.status.replace('_', ' ')}</Tag>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e' }}>
                  {ride.pickup} <span style={{ color: '#7c3aed', margin: '0 6px' }}>→</span> {ride.drop}
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>{ride.date} at {ride.time}</Text>
              </div>
              {ride.status === 'PENDING' && (
                <Button danger size="small" icon={<CloseCircleOutlined />}>Cancel</Button>
              )}
            </div>

            <Steps
              size="small"
              current={statusStep[ride.status]}
              style={{ marginBottom: ride.driver ? 16 : 0 }}
              items={[
                { title: 'Requested' },
                { title: 'Approved' },
                { title: 'Driver Assigned' },
                { title: 'In Progress' },
                { title: 'Completed' },
              ]}
            />

            {ride.driver && (
              <div style={{ background: '#f8f7ff', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserOutlined style={{ color: '#7c3aed' }} />
                  <Text strong>{ride.driver}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CarOutlined style={{ color: '#7c3aed' }} />
                  <Text strong>{ride.vehicle}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <EnvironmentOutlined style={{ color: '#22c55e' }} />
                  <Text style={{ color: '#22c55e', fontWeight: 600 }}>ETA ~12 min</Text>
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  )
}
