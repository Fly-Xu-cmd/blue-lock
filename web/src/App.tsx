import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<LoginScreen />} />
        {/* 主页面 */}
        <Route path="/home" element={<HomeScreen />} />
        {/* 数据分析页面 */}
        <Route path="/analysis" element={<AnalysisScreen />} />
        {/* 默认重定向到登录页面 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
