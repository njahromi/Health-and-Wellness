import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Typography, Space, Alert } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  HeartOutlined,
  ActivityOutlined,
  SleepOutlined,
  FireOutlined,
  TrophyOutlined,
  TrendingUpOutlined,
  AlertOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [healthData, setHealthData] = useState({
    activity: { steps: 0, goal: 10000, calories: 0 },
    heartRate: { current: 0, resting: 0, max: 0 },
    sleep: { hours: 0, quality: 0, goal: 8 },
    nutrition: { calories: 0, goal: 2000, protein: 0, carbs: 0, fat: 0 },
    weight: { current: 0, change: 0 },
    mood: { score: 0, trend: 'neutral' },
    hydration: { intake: 0, goal: 2500 },
    meditation: { minutes: 0, sessions: 0 }
  });
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate real-time data updates
    const fetchData = async () => {
      try {
        // In a real app, this would fetch from your API
        const mockData = generateMockData();
        setHealthData(mockData);
        
        // Generate insights
        const mockInsights = generateInsights(mockData);
        setInsights(mockInsights);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching health data:', error);
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const generateMockData = () => ({
    activity: {
      steps: Math.floor(Math.random() * 15000) + 5000,
      goal: 10000,
      calories: Math.floor(Math.random() * 800) + 200
    },
    heartRate: {
      current: Math.floor(Math.random() * 40) + 60,
      resting: Math.floor(Math.random() * 15) + 60,
      max: Math.floor(Math.random() * 20) + 180
    },
    sleep: {
      hours: (Math.random() * 3 + 6).toFixed(1),
      quality: Math.floor(Math.random() * 40) + 60,
      goal: 8
    },
    nutrition: {
      calories: Math.floor(Math.random() * 1000) + 1500,
      goal: 2000,
      protein: Math.floor(Math.random() * 50) + 50,
      carbs: Math.floor(Math.random() * 100) + 150,
      fat: Math.floor(Math.random() * 30) + 40
    },
    weight: {
      current: (Math.random() * 20 + 70).toFixed(1),
      change: (Math.random() * 2 - 1).toFixed(1)
    },
    mood: {
      score: Math.floor(Math.random() * 10) + 1,
      trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)]
    },
    hydration: {
      intake: Math.floor(Math.random() * 2000) + 1000,
      goal: 2500
    },
    meditation: {
      minutes: Math.floor(Math.random() * 60) + 10,
      sessions: Math.floor(Math.random() * 5) + 1
    }
  });

  const generateInsights = (data) => {
    const insights = [];
    
    if (data.activity.steps < data.activity.goal * 0.8) {
      insights.push({
        type: 'warning',
        message: 'You\'re below your daily step goal. Try taking a walk!',
        icon: <ActivityOutlined />
      });
    }
    
    if (data.heartRate.current > 100) {
      insights.push({
        type: 'warning',
        message: 'Your heart rate is elevated. Consider some deep breathing exercises.',
        icon: <HeartOutlined />
      });
    }
    
    if (data.sleep.hours < 7) {
      insights.push({
        type: 'warning',
        message: 'You\'re getting less sleep than recommended. Aim for 7-9 hours.',
        icon: <SleepOutlined />
      });
    }
    
    if (data.mood.score >= 8) {
      insights.push({
        type: 'success',
        message: 'Great mood today! Keep up the positive energy.',
        icon: <TrendingUpOutlined />
      });
    }
    
    return insights;
  };

  const activityData = [
    { time: '6AM', steps: 1200 },
    { time: '9AM', steps: 3500 },
    { time: '12PM', steps: 5800 },
    { time: '3PM', steps: 8200 },
    { time: '6PM', steps: 10500 },
    { time: '9PM', steps: 12500 }
  ];

  const nutritionData = [
    { name: 'Protein', value: healthData.nutrition.protein, color: '#1890ff' },
    { name: 'Carbs', value: healthData.nutrition.carbs, color: '#52c41a' },
    { name: 'Fat', value: healthData.nutrition.fat, color: '#faad14' }
  ];

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <Title level={2}>Health Dashboard</Title>
      
      {/* Insights */}
      {insights.length > 0 && (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
          {insights.map((insight, index) => (
            <Alert
              key={index}
              message={insight.message}
              type={insight.type}
              icon={insight.icon}
              showIcon
            />
          ))}
        </Space>
      )}

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Daily Steps"
              value={healthData.activity.steps}
              suffix={`/ ${healthData.activity.goal}`}
              prefix={<ActivityOutlined />}
            />
            <Progress
              percent={Math.min((healthData.activity.steps / healthData.activity.goal) * 100, 100)}
              status={healthData.activity.steps >= healthData.activity.goal ? 'success' : 'active'}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Heart Rate"
              value={healthData.heartRate.current}
              suffix="bpm"
              prefix={<HeartOutlined />}
            />
            <Text type="secondary">
              Resting: {healthData.heartRate.resting} bpm
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sleep"
              value={healthData.sleep.hours}
              suffix="hours"
              prefix={<SleepOutlined />}
            />
            <Text type="secondary">
              Quality: {healthData.sleep.quality}%
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Calories Burned"
              value={healthData.activity.calories}
              prefix={<FireOutlined />}
            />
            <Text type="secondary">
              Today's activity
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Activity Progress" style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="steps"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Nutrition Breakdown" style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={nutritionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {nutritionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text strong>Total Calories: {healthData.nutrition.calories}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Additional Metrics */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Weight Tracking">
            <Statistic
              title="Current Weight"
              value={healthData.weight.current}
              suffix="kg"
            />
            <Text type={healthData.weight.change >= 0 ? 'danger' : 'success'}>
              {healthData.weight.change >= 0 ? '+' : ''}{healthData.weight.change} kg this week
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card title="Mood Score">
            <Statistic
              title="Today's Mood"
              value={healthData.mood.score}
              suffix="/ 10"
            />
            <Text type="secondary">
              Trend: {healthData.mood.trend}
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card title="Hydration">
            <Statistic
              title="Water Intake"
              value={healthData.hydration.intake}
              suffix="ml"
            />
            <Progress
              percent={Math.min((healthData.hydration.intake / healthData.hydration.goal) * 100, 100)}
              status={healthData.hydration.intake >= healthData.hydration.goal ? 'success' : 'active'}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 