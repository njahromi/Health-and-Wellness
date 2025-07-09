import React from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { HeartOutlined, ActivityOutlined, SleepOutlined } from '@ant-design/icons';

const { Title } = Typography;

const HealthMetrics = () => {
  return (
    <div>
      <Title level={2}>Health Metrics</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Heart Rate Variability"
              value={45}
              suffix="ms"
              prefix={<HeartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="VO2 Max"
              value={42}
              suffix="ml/kg/min"
              prefix={<ActivityOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Sleep Efficiency"
              value={87}
              suffix="%"
              prefix={<SleepOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HealthMetrics; 