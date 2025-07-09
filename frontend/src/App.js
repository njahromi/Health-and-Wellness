import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  HeartOutlined,
  ActivityOutlined,
  SleepOutlined,
  NutritionOutlined,
  WeightOutlined,
  MoodOutlined,
  WaterOutlined,
  MeditationOutlined,
  SettingOutlined
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import HealthMetrics from './components/HealthMetrics';
import ActivityTracker from './components/ActivityTracker';
import SleepAnalysis from './components/SleepAnalysis';
import NutritionTracker from './components/NutritionTracker';
import WeightTracker from './components/WeightTracker';
import MoodTracker from './components/MoodTracker';
import HydrationTracker from './components/HydrationTracker';
import MeditationTracker from './components/MeditationTracker';
import Settings from './components/Settings';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function App() {
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'metrics',
      icon: <HeartOutlined />,
      label: 'Health Metrics',
    },
    {
      key: 'activity',
      icon: <ActivityOutlined />,
      label: 'Activity',
    },
    {
      key: 'sleep',
      icon: <SleepOutlined />,
      label: 'Sleep',
    },
    {
      key: 'nutrition',
      icon: <NutritionOutlined />,
      label: 'Nutrition',
    },
    {
      key: 'weight',
      icon: <WeightOutlined />,
      label: 'Weight',
    },
    {
      key: 'mood',
      icon: <MoodOutlined />,
      label: 'Mood',
    },
    {
      key: 'hydration',
      icon: <WaterOutlined />,
      label: 'Hydration',
    },
    {
      key: 'meditation',
      icon: <MeditationOutlined />,
      label: 'Meditation',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const renderContent = (key) => {
    switch (key) {
      case 'dashboard':
        return <Dashboard />;
      case 'metrics':
        return <HealthMetrics />;
      case 'activity':
        return <ActivityTracker />;
      case 'sleep':
        return <SleepAnalysis />;
      case 'nutrition':
        return <NutritionTracker />;
      case 'weight':
        return <WeightTracker />;
      case 'mood':
        return <MoodTracker />;
      case 'hydration':
        return <HydrationTracker />;
      case 'meditation':
        return <MeditationTracker />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          breakpoint="lg"
          collapsedWidth="0"
          style={{
            background: '#001529',
          }}
        >
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              VitalFlow
            </Title>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            items={menuItems}
            onClick={({ key }) => {
              // Handle navigation
              window.history.pushState({}, '', `/${key}`);
            }}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: 0,
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ padding: '0 24px' }}>
              <Title level={3} style={{ margin: '16px 0' }}>
                Health & Wellness Dashboard
              </Title>
            </div>
          </Header>
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              background: '#fff',
              borderRadius: '8px',
              minHeight: 280,
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/metrics" element={<HealthMetrics />} />
              <Route path="/activity" element={<ActivityTracker />} />
              <Route path="/sleep" element={<SleepAnalysis />} />
              <Route path="/nutrition" element={<NutritionTracker />} />
              <Route path="/weight" element={<WeightTracker />} />
              <Route path="/mood" element={<MoodTracker />} />
              <Route path="/hydration" element={<HydrationTracker />} />
              <Route path="/meditation" element={<MeditationTracker />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App; 