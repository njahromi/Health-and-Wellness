import React from 'react';
import { Card, Typography } from 'antd';
import { MoodOutlined } from '@ant-design/icons';

const { Title } = Typography;

const MoodTracker = () => {
  return (
    <div>
      <Title level={2}>Mood Tracker</Title>
      <Card>
        <MoodOutlined style={{ fontSize: '48px', color: '#eb2f96' }} />
        <Title level={4}>Mood tracking features coming soon!</Title>
        <p>This will include mood logging, emotional patterns, and wellness insights.</p>
      </Card>
    </div>
  );
};

export default MoodTracker; 