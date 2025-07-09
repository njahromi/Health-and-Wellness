import React from 'react';
import { Card, Typography } from 'antd';
import { WeightOutlined } from '@ant-design/icons';

const { Title } = Typography;

const WeightTracker = () => {
  return (
    <div>
      <Title level={2}>Weight Tracker</Title>
      <Card>
        <WeightOutlined style={{ fontSize: '48px', color: '#fa8c16' }} />
        <Title level={4}>Weight tracking features coming soon!</Title>
        <p>This will include weight trends, body composition, and goal tracking.</p>
      </Card>
    </div>
  );
};

export default WeightTracker; 