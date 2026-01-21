import './gesture-handler';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import { createStaticNavigation } from '@react-navigation/native';

const stack = createStackNavigator({
  initialRouteName: 'Login',
  screens: {
    Login: {
      screen: LoginScreen,
      options: {
        headerTitle: '登录',
        title: '登录',
      },
    },
    Home: {
      screen: HomeScreen,
      options: {
        headerShown: false,
        gestureEnabled: false,
        headerBackVisible: false,
      },
    },
    Analysis: {
      screen: AnalysisScreen,
      options: {
        headerTitle: '行为分析',
      },
    },
  },
});

const Navigation = createStaticNavigation(stack);

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  return (
    <View style={styles.container}>
      <Navigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});

export default App;
