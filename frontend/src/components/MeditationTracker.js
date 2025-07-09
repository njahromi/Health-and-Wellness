import React from 'react';
import { Card, Typography } from 'antd';
import { MeditationOutlined } from '@ant-design/icons';

const { Title } = Typography;

const MeditationTracker = () => {
  return (
    <div>
      <Title level={2}>Meditation Tracker</Title>
      <Card>
        <MeditationOutlined style={{ fontSize: '48px', color: '#722ed1' }} />
        <Title level={4}>Meditation tracking features coming soon!</Title>
        <p>This will include meditation sessions, mindfulness tracking, and stress management.</p>
      </Card>
    </div>
  );
};

export default MeditationTracker; 