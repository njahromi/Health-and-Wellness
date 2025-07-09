import React from 'react';
import { Card, Typography } from 'antd';
import { ActivityOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ActivityTracker = () => {
  return (
    <div>
      <Title level={2}>Activity Tracker</Title>
      <Card>
        <ActivityOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        <Title level={4}>Activity tracking features coming soon!</Title>
        <p>This will include detailed step tracking, workout logging, and activity analytics.</p>
      </Card>
    </div>
  );
};

export default ActivityTracker; 