import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Tabs } from "expo-router"
import { ThemeProvider } from "../contexts/ThemeContext"
import { Home, Settings } from "lucide-react-native"

const client = new QueryClient()

export default function RootLayout() {
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#000000",
              borderTopColor: "#1a1a1a",
              borderTopWidth: 1,
              height: 85,
              paddingBottom: 25,
              paddingTop: 10,
            },
            tabBarActiveTintColor: "#00d9ff",
            tabBarInactiveTintColor: "#6b7280",
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "600",
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Practice",
              tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
            }}
          />
        </Tabs>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
