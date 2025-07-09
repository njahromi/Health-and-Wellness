import React from 'react';
import { Card, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Settings = () => {
  return (
    <div>
      <Title level={2}>Settings</Title>
      <Card>
        <SettingOutlined style={{ fontSize: '48px', color: '#8c8c8c' }} />
        <Title level={4}>Settings features coming soon!</Title>
        <p>This will include user preferences, notification settings, and data management.</p>
      </Card>
    </div>
  );
};

export default Settings; 