import { Tabs } from "expo-router";
import React from "react";

import { TabBarIcon } from "@/components/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#121212",
          height: 64,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <>
              <TabBarIcon
                name={focused ? "home" : "home-outline"}
                color={color}
              />
              <Text
                className={`mt-1 ${
                  focused ? "text-accent" : "text-gray-500"
                } text-[12px]`}
              >
                Home
              </Text>
            </>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <>
              <TabBarIcon
                name={focused ? "search" : "search-outline"}
                color={color}
              />
              <Text
                className={`mt-1 ${
                  focused ? "text-accent" : "text-gray-500"
                } text-[12px]`}
              >
                Explore
              </Text>
            </>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <>
              <TabBarIcon
                name={focused ? "person" : "person-outline"}
                color={color}
              />
              <Text
                className={`mt-1 ${
                  focused ? "text-accent" : "text-gray-500"
                } text-[12px]`}
              >
                Profile
              </Text>
            </>
          ),
        }}
      />
    </Tabs>
  );
}
