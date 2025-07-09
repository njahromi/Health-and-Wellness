import React from 'react';
import { Card, Typography } from 'antd';
import { NutritionOutlined } from '@ant-design/icons';

const { Title } = Typography;

const NutritionTracker = () => {
  return (
    <div>
      <Title level={2}>Nutrition Tracker</Title>
      <Card>
        <NutritionOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
        <Title level={4}>Nutrition tracking features coming soon!</Title>
        <p>This will include calorie tracking, macro monitoring, and meal planning.</p>
      </Card>
    </div>
  );
};

export default NutritionTracker; 