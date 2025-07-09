import React from 'react';
import { Card, Typography } from 'antd';
import { SleepOutlined } from '@ant-design/icons';

const { Title } = Typography;

const SleepAnalysis = () => {
  return (
    <div>
      <Title level={2}>Sleep Analysis</Title>
      <Card>
        <SleepOutlined style={{ fontSize: '48px', color: '#722ed1' }} />
        <Title level={4}>Sleep tracking features coming soon!</Title>
        <p>This will include sleep duration, quality metrics, and sleep pattern analysis.</p>
      </Card>
    </div>
  );
};

export default SleepAnalysis; 