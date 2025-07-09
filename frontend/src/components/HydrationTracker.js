import React from 'react';
import { Card, Typography } from 'antd';
import { WaterOutlined } from '@ant-design/icons';

const { Title } = Typography;

const HydrationTracker = () => {
  return (
    <div>
      <Title level={2}>Hydration Tracker</Title>
      <Card>
        <WaterOutlined style={{ fontSize: '48px', color: '#13c2c2' }} />
        <Title level={4}>Hydration tracking features coming soon!</Title>
        <p>This will include water intake logging, hydration goals, and reminders.</p>
      </Card>
    </div>
  );
};

export default HydrationTracker; 